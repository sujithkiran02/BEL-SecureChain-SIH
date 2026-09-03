import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../../db';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const file = req.file; // Requires multer middleware
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const secureHash = `0x${hash}`;

    // Rename file to its hash for secure immutable storage
    const newPath = path.join(UPLOADS_DIR, secureHash);
    fs.renameSync(file.path, newPath);

    res.json({ 
      success: true, 
      metadataHash: secureHash,
      message: 'File securely stored and hashed.'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload asset' });
  }
};

export const downloadAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const asset = await prisma.asset.findUnique({
      where: { tokenId: Number(id) }
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.isRevoked) {
      return res.status(403).json({ error: 'Asset has been revoked' });
    }

    // RBAC: Only ADMIN_ROLE, MANAGER_ROLE, AUDITOR_ROLE or the asset OWNER can download
    const isOwner = asset.ownerWallet.toLowerCase() === user.address.toLowerCase();
    const hasRole = user.roles.some((r: string) => ['ADMIN_ROLE', 'MANAGER_ROLE', 'AUDITOR_ROLE'].includes(r));
    
    if (!isOwner && !hasRole) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to download this asset' });
    }

    const filePath = path.join(UPLOADS_DIR, asset.metadataHash);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on secure storage' });
    }

    // Integrity check
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const secureHash = `0x${hash}`;

    if (secureHash !== asset.metadataHash) {
      return res.status(500).json({ error: 'INTEGRITY COMPROMISED: File hash does not match blockchain record.' });
    }

    // Create an audit entry for download (we log to DB directly for this prototype)
    // Wait, the real AuditLog contract handles blockchain logs. But backend logging is faster for this.
    // Let's just log to DB.
    await prisma.auditEntry.create({
      data: {
        id: Math.floor(Math.random() * 1000000000), // Random ID for backend-only logs
        actionType: 'ASSET_DOWNLOADED',
        actorWallet: user.address,
        relatedAssetId: asset.tokenId,
        details: 'Asset downloaded securely with integrity check passed.',
        timestamp: new Date(),
        blockNumber: 0
      }
    });

    res.download(filePath, `asset-${id}.bin`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download asset' });
  }
};
