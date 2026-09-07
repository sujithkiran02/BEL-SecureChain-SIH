import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { verifySignature, getNonce } from './modules/auth/auth.controller';
import { requireAuth, requireRole } from './middlewares/auth.middleware';
import { startListener } from './chain/listener';
import { getAllIdentities, getIdentity } from './modules/identity/identity.controller';
import { uploadAsset, downloadAsset, getAssetDetails, updateAssetPolicy } from './modules/assets/asset.controller';
import { getDashboardStats } from './modules/dashboard/dashboard.controller';
import { verifyAsset } from './modules/verification/verify.controller';
import { socRouter } from './modules/soc/soc.controller';
import { quorumRouter } from './modules/quorum/quorum.controller';
import { CredentialController } from './modules/credentials/credential.controller';
import { FacilityController } from './modules/facilities/facility.controller';
import { BiometricController } from './modules/biometrics/biometric.controller';
import prisma from './db';
import multer from 'multer';

const upload = multer({ dest: 'uploads/tmp/' });

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. Authentication (SIWE + Replay Protection)
// ==========================================
app.get('/api/auth/nonce', getNonce);
app.post('/api/auth/verify', verifySignature);

// ==========================================
// 2. DID & W3C Verifiable Credentials
// ==========================================
app.get('/api/did/resolve/:did', CredentialController.resolveDid);
app.get('/api/pqc/info', CredentialController.getPqcInfo);

app.post('/api/credentials/issue', requireAuth, requireRole(['ADMIN_ROLE', 'MANAGER_ROLE']), CredentialController.issue);
app.get('/api/credentials/my-credentials', requireAuth, CredentialController.getMyCredentials);
app.get('/api/credentials/:id', requireAuth, CredentialController.getById);
app.post('/api/credentials/verify', CredentialController.verify);
app.post('/api/credentials/:id/revoke', requireAuth, requireRole(['ADMIN_ROLE', 'MANAGER_ROLE']), CredentialController.revoke);

// ==========================================
// 3. Multi-Facility & Biometric Layer
// ==========================================
app.get('/api/facilities', requireAuth, FacilityController.listFacilities);
app.post('/api/facilities/:id/request-access', requireAuth, FacilityController.requestAccess);
app.get('/api/facilities/logs', requireAuth, FacilityController.getLogs);

app.post('/api/biometric/verify', requireAuth, BiometricController.verify);
app.get('/api/biometric/status', requireAuth, BiometricController.getStatus);

// ==========================================
// 4. Zero-Trust Access & Audit Logs
// ==========================================
app.get('/api/zero-trust/logs', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.zeroTrustDecisionLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' }
    });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve Zero-Trust decision logs' });
  }
});

// ==========================================
// 5. SOC Defense & Threat Detection
// ==========================================
app.use('/api/soc', socRouter);

// ==========================================
// 6. Multi-Party Quorum Governance
// ==========================================
app.use('/api/quorum', quorumRouter);

// ==========================================
// 7. Blockchain Audit Timeline
// ==========================================
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

// ==========================================
// 8. Identity Registry API
// ==========================================
app.get('/api/identities', requireAuth, requireRole(['ADMIN_ROLE', 'MANAGER_ROLE', 'AUDITOR_ROLE']), getAllIdentities);
app.get('/api/identities/:walletAddress', requireAuth, getIdentity);

app.get('/api/identity/me', requireAuth, async (req, res) => {
  const wallet = (req as any).user.address.toLowerCase();
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

// ==========================================
// 9. Digital Asset Vault & Policies
// ==========================================
app.post('/api/assets/upload', requireAuth, upload.single('file'), uploadAsset);
app.get('/api/assets/:id/download', requireAuth, downloadAsset);
app.get('/api/assets/:id/policy', requireAuth, getAssetDetails);
app.post('/api/assets/:id/policy', requireAuth, requireRole(['ADMIN_ROLE', 'MANAGER_ROLE']), updateAssetPolicy);

// ==========================================
// 10. Dashboard & Public Verification
// ==========================================
app.get('/api/dashboard/stats', requireAuth, getDashboardStats);
app.get('/api/verify/:hash', verifyAsset);

app.listen(PORT, () => {
  console.log(`Defense Backend Server running on http://localhost:${PORT}`);
  // Start the blockchain listener in the background
  startListener();
});
