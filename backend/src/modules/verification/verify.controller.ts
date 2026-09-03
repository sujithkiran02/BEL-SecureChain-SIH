import { Request, Response } from 'express';
import prisma from '../../db';

export const verifyAsset = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    
    // Find asset by its metadataHash (SHA-256)
    const asset = await prisma.asset.findFirst({
      where: { metadataHash: hash }
    });

    if (!asset) {
      return res.status(404).json({ 
        verified: false, 
        message: 'No asset found with this hash on BEL SecureChain.' 
      });
    }

    if (asset.isRevoked) {
      return res.status(403).json({ 
        verified: false, 
        message: 'Asset was found but has been explicitly REVOKED by an Administrator.',
        ownerWallet: asset.ownerWallet,
        tokenId: asset.tokenId
      });
    }

    // Check if the owner's identity is valid (not revoked)
    const ownerIdentity = await prisma.identity.findUnique({
      where: { walletAddress: asset.ownerWallet }
    });

    if (!ownerIdentity || ownerIdentity.isRevoked) {
      return res.status(403).json({
        verified: false,
        message: 'Asset is active, but the OWNER identity has been REVOKED.',
        ownerWallet: asset.ownerWallet,
        tokenId: asset.tokenId
      });
    }

    res.json({
      verified: true,
      message: 'Asset is authentic, active, and securely recorded on BEL SecureChain.',
      details: {
        tokenId: asset.tokenId,
        ownerWallet: asset.ownerWallet,
        isOwnerVerified: ownerIdentity.isVerified,
        mintedAt: asset.createdAt // Assuming Prisma handles createdAt
      }
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify asset' });
  }
};
