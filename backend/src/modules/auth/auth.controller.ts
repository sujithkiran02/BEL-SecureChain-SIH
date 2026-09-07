import { Request, Response } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';
import prisma from '../../db';

export const getNonce = async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

    await prisma.nonceRecord.create({
      data: {
        nonce,
        expiresAt,
        used: false
      }
    });

    res.json({ nonce, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error('Failed to generate nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
};

export const verifySignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) {
      res.status(400).json({ error: 'Missing SIWE message or signature' });
      return;
    }

    const siweMessage = new SiweMessage(message);

    // 1. Verify nonce exists, is un-used, and un-expired in DB
    const nonceRecord = await prisma.nonceRecord.findUnique({
      where: { nonce: siweMessage.nonce }
    });

    if (!nonceRecord || nonceRecord.used || new Date() > nonceRecord.expiresAt) {
      res.status(401).json({
        error: 'SIWE Replay Protection: Invalid, expired, or previously consumed nonce'
      });
      return;
    }

    // Mark nonce as consumed to strictly prevent replay attacks
    await prisma.nonceRecord.update({
      where: { nonce: siweMessage.nonce },
      data: { used: true }
    });

    // 2. Verify Cryptographic SIWE Signature
    const { data } = await siweMessage.verify({ signature });
    const walletAddress = data.address.toLowerCase();

    // 3. Resolve Identity
    let identity = await prisma.identity.findUnique({
      where: { walletAddress },
      include: { roles: true }
    });

    if (!identity) {
      identity = await prisma.identity.create({
        data: {
          walletAddress,
          did: `did:securechain:${walletAddress}`,
          didDocumentHash: '',
          isVerified: false,
          isRevoked: false
        },
        include: { roles: true }
      });
    }

    if (identity.isRevoked) {
      res.status(403).json({
        error: 'Identity Revocation Cascade: Access Denied. Identity has been revoked by Security Administrator.',
        revoked: true
      });
      return;
    }

    if (identity.isQuarantined) {
      res.status(403).json({
        error: 'Access Denied: Identity placed under SOC Emergency Quarantine.',
        quarantined: true
      });
      return;
    }

    // 4. Issue authenticated JWT (short-lived 15m)
    const token = jwt.sign(
      {
        address: walletAddress,
        did: identity.did,
        isVerified: identity.isVerified,
        isRevoked: identity.isRevoked
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      token,
      identity,
      did: identity.did,
      roles: identity.roles.map(r => r.role)
    });
  } catch (error: any) {
    console.error('SIWE Verification failed:', error);
    res.status(401).json({ error: error.message || 'Cryptographic signature verification failed' });
  }
};
