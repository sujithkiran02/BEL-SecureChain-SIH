import { Request, Response } from 'express';
import prisma from '../../db';

export const getAllIdentities = async (req: Request, res: Response) => {
  try {
    const identities = await prisma.identity.findMany({
      include: {
        roles: true
      },
      orderBy: { registeredAt: 'desc' }
    });
    res.json({ identities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch identities' });
  }
};

export const getIdentity = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    const identity = await prisma.identity.findUnique({
      where: { walletAddress: String(walletAddress).toLowerCase() },
      include: { roles: true }
    });
    if (!identity) return res.status(404).json({ error: 'Identity not found' });
    res.json({ identity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch identity' });
  }
};
