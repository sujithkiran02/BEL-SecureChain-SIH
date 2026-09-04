import { Router, Request, Response } from 'express';
import { QuorumService } from './quorum.service';

const router = Router();
const quorumService = new QuorumService();

// GET /api/quorum/proposals
router.get('/proposals', async (req: Request, res: Response) => {
  try {
    const proposals = await quorumService.getProposals();
    res.json({ success: true, proposals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/quorum/proposals/:id
router.get('/proposals/:id', async (req: Request, res: Response) => {
  try {
    const proposalId = req.params.id as string;
    const proposal = await quorumService.getProposalById(proposalId);
    if (!proposal) {
      return res.status(404).json({ success: false, error: 'Proposal not found' });
    }
    res.json({ success: true, proposal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quorum/proposals
router.post('/proposals', async (req: Request, res: Response) => {
  try {
    const { title, actionType, description, targetResource, requiredSignatures, creatorWallet } = req.body;
    if (!title || !actionType || !creatorWallet) {
      return res.status(400).json({ success: false, error: 'title, actionType, and creatorWallet are required' });
    }

    const proposal = await quorumService.createProposal({
      title,
      actionType,
      description,
      targetResource,
      requiredSignatures: requiredSignatures ? parseInt(requiredSignatures, 10) : 2,
      creatorWallet,
    });

    res.json({ success: true, proposal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quorum/proposals/:id/sign
router.post('/proposals/:id/sign', async (req: Request, res: Response) => {
  try {
    const proposalId = req.params.id as string;
    const { officerWallet, officerRole, signature } = req.body;
    if (!officerWallet || !signature) {
      return res.status(400).json({ success: false, error: 'officerWallet and signature are required' });
    }

    const updatedProposal = await quorumService.signProposal({
      proposalId,
      officerWallet,
      officerRole: officerRole || 'COMMANDER_ROLE',
      signature,
    });

    res.json({ success: true, proposal: updatedProposal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/quorum/proposals/:id/execute
router.post('/proposals/:id/execute', async (req: Request, res: Response) => {
  try {
    const proposalId = req.params.id as string;
    const { executorWallet } = req.body;
    if (!executorWallet) {
      return res.status(400).json({ success: false, error: 'executorWallet is required' });
    }

    const executedProposal = await quorumService.executeProposal(proposalId, executorWallet);
    res.json({ success: true, proposal: executedProposal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export const quorumRouter = router;
