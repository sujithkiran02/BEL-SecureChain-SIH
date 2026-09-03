import { Request, Response } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';
import prisma from '../../db';

export const getNonce = async (req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    // In a real app, store nonce in session/cache with expiration
    res.json({ nonce });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
};

export const verifySignature = async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    
    // Verify the signature
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
