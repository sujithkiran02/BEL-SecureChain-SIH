import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import { getNonce, verifySignature } from './modules/auth/auth.controller';
import { requireAuth } from './middlewares/auth.middleware';
import { startListener } from './chain/listener';
import prisma from './db';

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

// Identity placeholder
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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  // Start the blockchain listener in the background
  startListener();
});
