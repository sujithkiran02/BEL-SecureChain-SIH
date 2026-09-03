import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { verifySignature, getNonce } from './modules/auth/auth.controller';
import { requireAuth, requireRole } from './middlewares/auth.middleware';
import { startListener } from './chain/listener';
import { getAllIdentities, getIdentity } from './modules/identity/identity.controller';
import { uploadAsset, downloadAsset } from './modules/assets/asset.controller';
import { getDashboardStats } from './modules/dashboard/dashboard.controller';
import { verifyAsset } from './modules/verification/verify.controller';
import prisma from './db';
import multer from 'multer';

const upload = multer({ dest: 'uploads/tmp/' });

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes
app.get('/api/auth/nonce', getNonce);
app.post('/api/auth/verify', verifySignature);

// Audit route
app.get('/api/audit/timeline', requireAuth, async (req, res) => {
  try {
    const entries = await prisma.auditEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: { actor: true }
    });
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit timeline' });
  }
});

// Identity routes
app.get('/api/identities', requireAuth, requireRole(['ADMIN_ROLE', 'MANAGER_ROLE', 'AUDITOR_ROLE']), getAllIdentities);
app.get('/api/identities/:walletAddress', requireAuth, getIdentity);

app.get('/api/identity/me', requireAuth, async (req, res) => {
  const wallet = (req as any).user.address;
  try {
    const identity = await prisma.identity.findUnique({
      where: { walletAddress: wallet },
      include: { roles: true }
    });
    res.json({ identity });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch identity' });
  }
});

// Asset routes
app.post('/api/assets/upload', requireAuth, upload.single('file'), uploadAsset);
app.get('/api/assets/:id/download', requireAuth, downloadAsset);

// Dashboard stats
app.get('/api/dashboard/stats', requireAuth, getDashboardStats);

// Public Verification
app.get('/api/verify/:hash', verifyAsset);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // Start the blockchain listener in the background
  startListener();
});
