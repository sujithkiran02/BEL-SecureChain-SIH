import { Request, Response } from 'express';
import crypto from 'crypto';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import prisma from '../../db';
import { JWT_SECRET } from '../../config';

export class DidAuthController {
  /**
   * POST /api/did/auth/challenge
   * Generates a cryptographically random single-use challenge for DID Proof-of-Possession
   */
  public static async requestChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress, did } = req.body;
      if (!walletAddress) {
        res.status(400).json({ error: 'walletAddress is required' });
        return;
      }

      const wallet = walletAddress.toLowerCase();
      const expectedDid = did || `did:securechain:${wallet}`;

      // Cryptographically random 32-byte challenge
      const randomBytes = crypto.randomBytes(32).toString('hex');
      const challenge = `BEL-DID-AUTH-CHALLENGE:${randomBytes}:${Date.now()}`;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await prisma.nonceRecord.create({
        data: {
          nonce: challenge,
          walletAddress: wallet,
          domain: 'https://securechain.bel.gov.in',
          expiresAt,
          used: false
        }
      });

      res.json({
        challenge,
        did: expectedDid,
        walletAddress: wallet,
        expiresAt: expiresAt.toISOString(),
        domain: 'https://securechain.bel.gov.in'
      });
    } catch (error: any) {
      console.error('DID challenge error:', error);
      res.status(500).json({ error: 'Failed to generate DID authentication challenge' });
    }
  }

  /**
   * POST /api/did/auth/verify
   * Verifies cryptographic signature over challenge, checks identity status, and issues session token
   */
  public static async verifyChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { challenge, signature, walletAddress, did } = req.body;
      if (!challenge || !signature || !walletAddress) {
        res.status(400).json({ error: 'Missing required parameters: challenge, signature, walletAddress' });
        return;
      }

      const wallet = walletAddress.toLowerCase();
      const expectedDid = did ? did.toLowerCase() : `did:securechain:${wallet}`;

      // 1. Verify challenge exists in NonceRecord, not consumed, not expired
      const nonceRecord = await prisma.nonceRecord.findUnique({
        where: { nonce: challenge }
      });

      if (!nonceRecord || nonceRecord.used || new Date() > nonceRecord.expiresAt) {
        res.status(401).json({
          error: 'DID Authentication Failed: Challenge is invalid, expired, or previously consumed (Replay Attack Denied)',
          reasonCode: 'DID_CHALLENGE_EXPIRED_OR_REUSED'
        });
        return;
      }

      // Mark challenge as consumed atomically
      await prisma.nonceRecord.update({
        where: { nonce: challenge },
        data: { used: true }
      });

      // 2. Cryptographically recover wallet from signature over the challenge
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(challenge, signature).toLowerCase();
      } catch (err) {
        res.status(401).json({
          error: 'DID Proof-of-Possession Invalid: Cryptographic signature verification failed',
          reasonCode: 'DID_SIGNATURE_INVALID'
        });
        return;
      }

      // 3. Ensure recovered wallet matches claimed wallet
      if (recoveredAddress !== wallet) {
        res.status(401).json({
          error: 'DID Proof-of-Possession Mismatch: Signature was created by a different private key',
          reasonCode: 'DID_WALLET_MISMATCH'
        });
        return;
      }

      // 4. Resolve Identity in Database / Blockchain Registry
      let identity = await prisma.identity.findUnique({
        where: { walletAddress: wallet },
        include: { roles: true }
      });

      if (!identity) {
        identity = await prisma.identity.create({
          data: {
            walletAddress: wallet,
            did: `did:securechain:${wallet}`,
            didDocumentHash: '',
            isVerified: false,
            isRevoked: false
          },
          include: { roles: true }
        });
      }

      // 5. Check Identity Revocation & Quarantine Status
      if (identity.isRevoked) {
        res.status(403).json({
          error: 'Access Denied: Decentralized Identity has been REVOKED by Security Administrator',
          reasonCode: 'IDENTITY_REVOKED'
        });
        return;
      }

      if (identity.isQuarantined) {
        res.status(403).json({
          error: 'Access Denied: Decentralized Identity is under Security Quarantine',
          reasonCode: 'IDENTITY_QUARANTINED'
        });
        return;
      }

      // 6. Fetch Active VC count for context
      const activeCredentialsCount = await prisma.verifiableCredential.count({
        where: {
          OR: [
            { subjectWallet: wallet },
            { subjectDid: identity.did }
          ],
          status: 'ACTIVE',
          expirationDate: { gt: new Date() }
        }
      });

      // 7. Issue short-lived authenticated JWT (15m)
      const token = jwt.sign(
        {
          address: wallet,
          did: identity.did,
          isVerified: identity.isVerified,
          isRevoked: identity.isRevoked
        },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Log successful DID auth
      await prisma.auditEntry.create({
        data: {
          id: Math.floor(Math.random() * 1000000000),
          actionType: 'DID_AUTHENTICATED',
          actorWallet: wallet,
          details: `DID ${identity.did} successfully proved possession via challenge-response.`,
          timestamp: new Date(),
          blockNumber: 0
        }
      });

      res.json({
        success: true,
        message: 'DID Proof-of-Possession authenticated successfully',
        token,
        did: identity.did,
        walletAddress: wallet,
        identity: {
          did: identity.did,
          isVerified: identity.isVerified,
          isRevoked: identity.isRevoked,
          registeredAt: identity.registeredAt,
          roles: identity.roles.map(r => r.role)
        },
        activeCredentialsCount
      });
    } catch (error: any) {
      console.error('DID auth verify error:', error);
      res.status(500).json({ error: error.message || 'DID verification exception' });
    }
  }
}
