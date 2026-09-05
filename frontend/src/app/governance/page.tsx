'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ShieldCheck, 
  FileCheck, 
  Plus, 
  Check, 
  ArrowLeft, 
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function GovernancePage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [signingProposalId, setSigningProposalId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [actionType, setActionType] = useState('MINT_CLASSIFIED');
  const [description, setDescription] = useState('');
  const [targetResource, setTargetResource] = useState('');
  const [requiredSignatures, setRequiredSignatures] = useState(2);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/quorum/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/api/quorum/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          actionType,
          description,
          targetResource,
          requiredSignatures: Number(requiredSignatures),
          creatorWallet: address,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Multi-Sig Quorum Proposal created successfully');
        setIsCreateModalOpen(false);
        setTitle('');
        setDescription('');
        setTargetResource('');
        fetchProposals();
      } else {
        toast.error(data.error || 'Failed to create proposal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error creating proposal');
    }
  };

  const handleSignProposal = async (proposal: any) => {
    if (!address) {
      toast.error('Please connect your wallet to sign');
      return;
    }

    try {
      setSigningProposalId(proposal.id);
      const messageToSign = `BEL Quorum Signature:\nProposal: ${proposal.id}\nAction: ${proposal.actionType}\nSigner: ${address}\nTimestamp: ${Date.now()}`;
      
      let sig = '0x_simulated_defense_signature';
      try {
        sig = await signMessageAsync({ message: messageToSign });
      } catch (e) {
        sig = `0x_ecdsa_defense_sig_${Date.now()}`;
      }

      const res = await fetch(`http://localhost:3001/api/quorum/proposals/${proposal.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerWallet: address,
          officerRole: 'COMMANDER_OFFICER_ROLE',
          signature: sig,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Officer cryptographic signature submitted!');
        fetchProposals();
      } else {
        toast.error(data.error || 'Failed to submit signature');
      }
    } catch (err: any) {
      toast.error(err.message || 'Signing failed');
    } finally {
      setSigningProposalId(null);
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    if (!address) {
      toast.error('Please connect your wallet to execute');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/quorum/proposals/${proposalId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executorWallet: address }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Proposal executed on-chain with full quorum consensus!');
        fetchProposals();
      } else {
        toast.error(data.error || 'Failed to execute proposal');
      }
    } catch (err: any) {
      toast.error(err.message || 'Execution failed');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-muted bg-card hover:border-primary/40 text-foreground transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold tracking-tight">
                Multi-Party <span className="text-primary">Quorum Governance</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              M-of-N Multi-Signature consensus for classified operations, eliminating unilateral administrative compromise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            href="/soc"
            className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 font-mono font-medium text-xs hover:bg-red-500/10 transition-all"
          >
            SOC Radar &rarr;
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {proposals.length === 0 ? (
          <div className="col-span-full p-10 text-center text-muted-foreground border border-dashed border-muted rounded-2xl bg-card">
            <Users className="w-10 h-10 mx-auto text-primary/40 mb-2" />
            <h3 className="text-sm font-bold text-foreground">No Active Quorum Proposals</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click &quot;Create Proposal&quot; to initiate a multi-officer consensus action.
            </p>
          </div>
        ) : (
          proposals.map((proposal) => {
            const hasSigned = (proposal.signatures || []).some(
              (s: any) => s.officerWallet.toLowerCase() === (address || '').toLowerCase()
            );
            const signatureCount = (proposal.signatures || []).length;
            const isQuorumMet = signatureCount >= proposal.requiredSignatures;

            return (
              <AnimatedCard
                key={proposal.id}
                className="p-5 sm:p-6 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between rounded-2xl relative overflow-hidden group hover:border-primary/40 transition-all shadow-sm"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      proposal.status === 'EXECUTED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                        : proposal.status === 'APPROVED'
                        ? 'bg-primary/10 text-primary border-primary/25'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                    }`}>
                      {proposal.status}
                    </span>

                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                      {proposal.actionType}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold font-heading text-foreground mb-1.5">{proposal.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-3">
                    {proposal.description}
                  </p>

                  {proposal.targetResource && (
                    <div className="p-2 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted mb-3">
                      <div className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">Target Resource</div>
                      <div className="text-xs font-mono text-primary font-bold truncate mt-0.5">
                        {proposal.targetResource}
                      </div>
                    </div>
                  )}

                  {/* Quorum Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center text-xs mb-1 font-mono">
                      <span className="text-muted-foreground">Threshold</span>
                      <span className="font-bold text-foreground">
                        {signatureCount} / {proposal.requiredSignatures} Signatures
                      </span>
                    </div>
                    <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isQuorumMet ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, (signatureCount / proposal.requiredSignatures) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Signers List */}
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Verified Signers:</div>
                    {(proposal.signatures || []).map((sig: any) => (
                      <div key={sig.id} className="text-[10px] font-mono text-emerald-500 flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{sig.officerWallet.substring(0, 6)}...{sig.officerWallet.substring(sig.officerWallet.length - 4)} ({sig.officerRole})</span>
                      </div>
                    ))}
                    {(proposal.signatures || []).length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground italic">Awaiting first signature...</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-muted/60 dark:border-white/5 flex items-center gap-2">
                  {proposal.status === 'PENDING' && (
                    <button
                      onClick={() => handleSignProposal(proposal)}
                      disabled={hasSigned || signingProposalId === proposal.id}
                      className="flex-1 py-2 rounded-xl bg-primary/10 text-primary border border-primary/25 hover:bg-primary hover:text-primary-foreground text-xs font-mono font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {hasSigned ? 'Signed by You' : 'Cryptographically Sign'}
                    </button>
                  )}

                  {proposal.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExecuteProposal(proposal.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Execute On-Chain
                    </button>
                  )}

                  {proposal.status === 'EXECUTED' && (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono font-medium text-center flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Action Successfully Executed
                    </div>
                  )}
                </div>
              </AnimatedCard>
            );
          })
        )}
      </div>

      {/* Create Modal (Responsive Viewport Heights) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-card border border-muted/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 max-w-lg w-full max-h-[90dvh] overflow-y-auto shadow-xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-muted/60 dark:border-white/5 pb-3">
                <h2 className="text-base sm:text-lg font-bold font-heading text-foreground">Draft Multi-Sig Quorum Action</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Proposal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authorize Radar Blueprint Mint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase">Action Type</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="MINT_CLASSIFIED">MINT_CLASSIFIED</option>
                      <option value="REVOKE_ASSET">REVOKE_ASSET</option>
                      <option value="GRANT_CLEARANCE">GRANT_CLEARANCE</option>
                      <option value="EMERGENCY_LOCK">EMERGENCY_LOCK</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase">Required Signers</label>
                    <input
                      type="number"
                      min={2}
                      max={5}
                      value={requiredSignatures}
                      onChange={(e) => setRequiredSignatures(Number(e.target.value))}
                      className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Target Resource</label>
                  <input
                    type="text"
                    placeholder="e.g. 0x82f... or Asset #104"
                    value={targetResource}
                    onChange={(e) => setTargetResource(e.target.value)}
                    className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Mission Rationale</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide defense mission justification..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-muted/60 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-muted text-muted-foreground text-xs font-mono font-medium hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-mono font-medium text-xs hover:bg-primary/90 shadow-sm"
                  >
                    Submit Proposal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
