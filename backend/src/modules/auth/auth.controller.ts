import { Request, Response } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';
import prisma from '../../db';

const nonceStore = new Map<string, { expiresAt: number }>();

export const getNonce = async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    // Store nonce with 5 minutes expiration
    nonceStore.set(nonce, { expiresAt: Date.now() + 5 * 60 * 1000 });
    res.json({ nonce });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
};

export const verifySignature = async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // 1. Verify nonce exists and hasn't expired
    const storedNonce = nonceStore.get(siweMessage.nonce);
    if (!storedNonce) {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }
    if (Date.now() > storedNonce.expiresAt) {
      nonceStore.delete(siweMessage.nonce);
      return res.status(401).json({ error: 'Nonce expired' });
    }
    // Delete nonce to prevent replay attacks
    nonceStore.delete(siweMessage.nonce);

    // 2. Verify the signature
    const { data } = await siweMessage.verify({ signature });
    
    const walletAddress = data.address.toLowerCase();

    // Upsert user identity in DB if it doesn't exist just to have a record,
    // though actual registration happens on-chain.
    let identity = await prisma.identity.findUnique({
      where: { walletAddress }
    });

    if (!identity) {
      identity = await prisma.identity.create({
        data: {
          walletAddress,
          did: `did:trustchain:${walletAddress}`,
          didDocumentHash: '',
        }
      });
    } else if (identity.isRevoked) {
      return res.status(403).json({ error: 'Identity has been revoked. Access denied.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        address: walletAddress,
        isVerified: identity.isVerified,
        isRevoked: identity.isRevoked
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token, identity });
  } catch (error) {
    console.error('SIWE Verification failed:', error);
    res.status(401).json({ error: 'Invalid signature' });
  }
};
