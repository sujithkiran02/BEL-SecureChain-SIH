import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../../db';
import { ZeroTrustEngine } from '../zero-trust/zero-trust.service';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const uploadAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { classification, requiredClearance, allowedFacilities, allowedRoles } = req.body;

    const fileBuffer = fs.readFileSync(file.path);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const secureHash = `0x${hash}`;

    // Rename file to its trusted hash for secure content-addressable storage
    const newPath = path.join(UPLOADS_DIR, secureHash);
    fs.renameSync(file.path, newPath);

    res.json({
      success: true,
      metadataHash: secureHash,
      sha256: hash,
      sizeBytes: fileBuffer.length,
      mimeType: file.mimetype,
      classification: classification || 'CONFIDENTIAL',
      requiredClearance: Number(requiredClearance) || 2,
      message: 'File securely hashed and stored in tamper-evident defense vault.'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload and hash asset' });
  }
};

export const downloadAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const wallet = user.address.toLowerCase();

    const assetId = Number(id);
    const asset = await prisma.asset.findUnique({
      where: { tokenId: assetId }
    });

    if (!asset) {
      res.status(404).json({ error: 'Digital Asset not found in registry' });
      return;
    }

    // 1. Zero-Trust Policy Authorization Check
    const decision = await ZeroTrustEngine.authorize({
      walletAddress: wallet,
      resourceType: 'ASSET',
      resourceId: String(assetId),
      action: 'DOWNLOAD'
    });

    if (!decision.allowed) {
      // Log unauthorized download attempt to SOC
      await prisma.securityAlert.create({
        data: {
          severity: 'HIGH',
          tactic: 'Unauthorized Classified Data Access',
          description: `Blocked unauthorized download of Asset #${assetId} by ${wallet}. Reason: ${decision.reason}`,
          targetWallet: wallet,
          threatScore: 80,
          status: 'ACTIVE'
        }
      });

      res.status(403).json({
        error: 'Access Denied: Zero-Trust authorization failed',
        reason: decision.reason,
        decision
      });
      return;
    }

    // 2. Real-time File Integrity Check
    const filePath = path.join(UPLOADS_DIR, asset.metadataHash);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Asset binary payload not found on storage node' });
      return;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const calculatedHash = `0x${crypto.createHash('sha256').update(fileBuffer).digest('hex')}`;

    if (calculatedHash.toLowerCase() !== asset.metadataHash.toLowerCase()) {
      // INTEGRITY COMPROMISED - Raise CRITICAL SOC alert immediately
      await prisma.securityAlert.create({
        data: {
          severity: 'CRITICAL',
          tactic: 'Data Tampering / Hash Mismatch',
          description: `CRITICAL ALERT: File tampering detected on Asset #${assetId}! Stored hash (${calculatedHash}) does not match immutable blockchain record (${asset.metadataHash}). Access terminated.`,
          targetWallet: wallet,
          threatScore: 100,
          status: 'ACTIVE'
        }
      });

      res.status(500).json({
        error: 'SECURITY CRITICAL: INTEGRITY COMPROMISED. File payload hash does not match trusted blockchain record. Access blocked.',
        trustedHash: asset.metadataHash,
        calculatedHash
      });
      return;
    }

    // 3. Log download event
    await prisma.auditEntry.create({
      data: {
        id: Math.floor(Math.random() * 1000000000),
        actionType: 'ASSET_DOWNLOADED',
        actorWallet: wallet,
        relatedAssetId: asset.tokenId,
        details: `Secure download of Asset #${assetId} completed. SHA-256 integrity verified.`,
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

export const getAssetDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assetId = Number(id);

    const asset = await prisma.asset.findUnique({
      where: { tokenId: assetId },
      include: { owner: true }
    });

    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }

    let policy = await prisma.assetPolicy.findUnique({
      where: { assetId }
    });

    if (!policy) {
      policy = await prisma.assetPolicy.create({
        data: {
          assetId,
          classification: 'CONFIDENTIAL',
          requiredClearance: 2,
          allowedFacilities: 'FACILITY-A,FACILITY-B,FACILITY-C',
          allowedRoles: 'ADMIN_ROLE,MANAGER_ROLE,USER_ROLE',
          allowedActions: 'VIEW,DOWNLOAD',
          integrityHash: asset.metadataHash
        }
      });
    }

    res.json({
      asset: {
        ...asset,
        policy
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch asset details' });
  }
};

export const updateAssetPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const assetId = Number(id);
    const { classification, requiredClearance, allowedFacilities, allowedRoles, allowedActions } = req.body;

    const policy = await prisma.assetPolicy.upsert({
      where: { assetId },
      update: {
        classification,
        requiredClearance: Number(requiredClearance) || 2,
        allowedFacilities: allowedFacilities || 'FACILITY-A,FACILITY-B,FACILITY-C',
        allowedRoles: allowedRoles || 'ADMIN_ROLE,MANAGER_ROLE,USER_ROLE',
        allowedActions: allowedActions || 'VIEW,DOWNLOAD'
      },
      create: {
        assetId,
        classification: classification || 'CONFIDENTIAL',
        requiredClearance: Number(requiredClearance) || 2,
        allowedFacilities: allowedFacilities || 'FACILITY-A,FACILITY-B,FACILITY-C',
        allowedRoles: allowedRoles || 'ADMIN_ROLE,MANAGER_ROLE,USER_ROLE',
        allowedActions: allowedActions || 'VIEW,DOWNLOAD'
      }
    });

    res.json({ success: true, policy });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update asset policy' });
  }
};
