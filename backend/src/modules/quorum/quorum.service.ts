import prisma from '../../db';

export interface CreateProposalDto {
  title: string;
  actionType: 'MINT_CLASSIFIED' | 'REVOKE_ASSET' | 'GRANT_CLEARANCE' | 'EMERGENCY_LOCK';
  description: string;
  targetResource?: string;
  requiredSignatures?: number;
  creatorWallet: string;
}

export interface SignProposalDto {
  proposalId: string;
  officerWallet: string;
  officerRole: string;
  signature: string;
}

export class QuorumService {
  /**
   * Fetch all proposals with their signatures
   */
  async getProposals() {
    return (prisma as any).proposal.findMany({
      include: {
        signatures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch single proposal
   */
  async getProposalById(id: string) {
    return (prisma as any).proposal.findUnique({
      where: { id },
      include: {
        signatures: true,
      },
    });
  }

  /**
   * Create a new Multi-Sig Quorum Proposal
   */
  async createProposal(dto: CreateProposalDto) {
    const proposal = await (prisma as any).proposal.create({
      data: {
        title: dto.title,
        actionType: dto.actionType,
        description: dto.description,
        targetResource: dto.targetResource || null,
        requiredSignatures: dto.requiredSignatures || 2,
        creatorWallet: dto.creatorWallet,
        status: 'PENDING',
      },
      include: {
        signatures: true,
      },
    });

    return proposal;
  }

  /**
   * Submit an officer cryptographic signature for a proposal
   */
  async signProposal(dto: SignProposalDto) {
    const proposal = await (prisma as any).proposal.findUnique({
      where: { id: dto.proposalId },
      include: { signatures: true },
    });

    if (!proposal) {
      throw new Error(`Proposal with ID ${dto.proposalId} does not exist.`);
    }

    if (proposal.status !== 'PENDING') {
      throw new Error(`Proposal is already ${proposal.status} and cannot receive new signatures.`);
    }

    // Check if officer already signed
    const existingSig = proposal.signatures.find(
      (s: any) => s.officerWallet.toLowerCase() === dto.officerWallet.toLowerCase()
    );
    if (existingSig) {
      throw new Error(`Officer ${dto.officerWallet} has already signed this proposal.`);
    }

    // Record the signature
    await (prisma as any).proposalSignature.create({
      data: {
        proposalId: dto.proposalId,
        officerWallet: dto.officerWallet,
        officerRole: dto.officerRole || 'COMMANDER_ROLE',
        signature: dto.signature,
      },
    });

    // Check if threshold is met
    const updatedCount = proposal.signatures.length + 1;

    if (updatedCount >= proposal.requiredSignatures) {
      await (prisma as any).proposal.update({
        where: { id: dto.proposalId },
        data: { status: 'APPROVED' },
      });
    }

    return (prisma as any).proposal.findUnique({
      where: { id: dto.proposalId },
      include: { signatures: true },
    });
  }

  /**
   * Execute an approved proposal
   */
  async executeProposal(proposalId: string, executorWallet: string) {
    const proposal = await (prisma as any).proposal.findUnique({
      where: { id: proposalId },
      include: { signatures: true },
    });

    if (!proposal) {
      throw new Error('Proposal not found');
    }

    if (proposal.status !== 'APPROVED') {
      throw new Error(`Proposal must be in APPROVED state with sufficient signatures. Current state: ${proposal.status}`);
    }

    // Mark as EXECUTED
    const executed = await (prisma as any).proposal.update({
      where: { id: proposalId },
      data: { status: 'EXECUTED' },
      include: { signatures: true },
    });

    // Create a corresponding audit alert
    await (prisma as any).securityAlert.create({
      data: {
        severity: 'LOW',
        tactic: 'Quorum Execution Consensual',
        description: `Multi-Sig Proposal '${proposal.title}' reached quorum (${proposal.signatures.length}/${proposal.requiredSignatures}) and executed by ${executorWallet}`,
        threatScore: 0,
        status: 'RESOLVED',
      },
    });

    return executed;
  }
}
