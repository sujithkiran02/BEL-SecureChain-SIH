import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../db';

export class BiometricController {
  /**
   * POST /api/biometric/verify
   * Simulates defense-grade biometric verification (Face / Iris / Fingerprint)
   * Produces a cryptographic short-lived session token (TTL: 15 minutes)
   */
  public static async verify(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = (req as any).user.address.toLowerCase();
      const { method, biometricDataHash, simulateFailure } = req.body;

      // Identity check
      const identity = await prisma.identity.findUnique({
        where: { walletAddress }
      });

      if (!identity) {
        res.status(404).json({ error: 'Identity not registered for this wallet' });
        return;
      }

      if (simulateFailure) {
        res.status(401).json({
          verified: false,
          error: 'Biometric template mismatch or spoofing detected',
          confidenceScore: 0.32
        });
        return;
      }

      // Generate Biometric Attestation Token (valid for 15 mins)
      const sessionToken = `bio-${uuidv4()}`;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.biometricSession.create({
        data: {
          sessionToken,
          walletAddress,
          did: identity.did,
          method: method || 'MULTI_MODAL_FACE_IRIS',
          verified: true,
          threatScore: 0,
          expiresAt
        }
      });

      res.json({
        verified: true,
        sessionToken,
        method: method || 'MULTI_MODAL_FACE_IRIS',
        confidenceScore: 0.998,
        did: identity.did,
        expiresAt: expiresAt.toISOString(),
        message: 'Biometric verification successful. Defense token issued (15 min TTL).'
      });
    } catch (error: any) {
      console.error('Biometric verification error:', error);
      res.status(500).json({ error: 'Biometric verification service error' });
    }
  }

  /**
   * GET /api/biometric/status
   * Check active biometric status for the authenticated user
   */
  public static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = (req as any).user.address.toLowerCase();
      const activeSession = await prisma.biometricSession.findFirst({
        where: {
          walletAddress,
          verified: true,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        hasActiveSession: !!activeSession,
        session: activeSession
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve biometric status' });
    }
  }
}
