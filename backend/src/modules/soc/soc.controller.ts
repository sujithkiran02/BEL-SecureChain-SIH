import { Router, Request, Response } from 'express';
import { SocService } from './soc.service';

const router = Router();
const socService = new SocService();

// GET /api/soc/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await socService.getSocStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/soc/alerts
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await socService.getAlerts();
    res.json({ success: true, alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/soc/quarantined
router.get('/quarantined', async (req: Request, res: Response) => {
  try {
    const quarantined = await socService.getQuarantinedIdentities();
    res.json({ success: true, quarantined });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/soc/quarantine
router.post('/quarantine', async (req: Request, res: Response) => {
  try {
    const { walletAddress, shouldQuarantine, reason } = req.body;
    if (!walletAddress || typeof shouldQuarantine !== 'boolean') {
      return res.status(400).json({ success: false, error: 'walletAddress and shouldQuarantine (boolean) are required' });
    }

    const result = await socService.toggleQuarantine(walletAddress, shouldQuarantine, reason);
    res.json({ success: true, message: `Quarantine status updated for ${walletAddress}`, identity: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/soc/simulate-attack (For SIH Live Demonstration)
router.post('/simulate-attack', async (req: Request, res: Response) => {
  try {
    const { attackType, actorWallet } = req.body;
    const alert = await socService.simulateAttack(attackType || 'EXFILTRATION', actorWallet);
    res.json({ success: true, message: 'Attack anomaly injected successfully', alert });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/soc/alerts/:id/resolve
router.post('/alerts/:id/resolve', async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id as string, 10);
    const updated = await socService.resolveAlert(alertId);
    res.json({ success: true, message: 'Alert marked as resolved', alert: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const socRouter = router;
