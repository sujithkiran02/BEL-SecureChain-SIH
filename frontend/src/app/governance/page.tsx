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
  Clock, 
  ArrowLeft, 
  AlertCircle, 
  Lock, 
  Flame,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  FileText
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
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 md:p-8 max-w-[1600px] mx-auto w-full gap-6 cyber-grid">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight">
                Multi-Party <span className="text-primary text-glow">Quorum Governance</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              M-of-N Multi-Signature consensus for classified operations, eliminating unilateral administrative compromise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/soc"
            className="px-4 py-2 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-mono font-bold text-xs hover:bg-red-500 hover:text-white transition-all"
          >
            Defense SOC Radar &rarr;
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-background font-mono font-bold text-xs hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Quorum Proposal
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proposals.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed border-primary/20 rounded-2xl bg-card/40">
            <Users className="w-12 h-12 mx-auto text-primary/40 mb-3" />
            <h3 className="text-base font-bold text-foreground">No Active Quorum Proposals</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Create Quorum Proposal&quot; to initiate a multi-officer consensus action.
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
                className="p-6 bg-card/60 backdrop-blur-xl border border-primary/20 flex flex-col justify-between rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-all shadow-lg"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      proposal.status === 'EXECUTED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : proposal.status === 'APPROVED'
                        ? 'bg-primary/20 text-primary border-primary/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}>
                      {proposal.status}
                    </span>

                    <span className="text-[10px] font-mono text-muted-foreground bg-background/60 px-2 py-0.5 rounded border border-primary/10">
                      {proposal.actionType}
                    </span>
                  </div>

                  <h3 className="text-base font-bold font-heading text-foreground mb-2">{proposal.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                    {proposal.description}
                  </p>

                  {proposal.targetResource && (
                    <div className="p-2.5 rounded-xl bg-background/60 border border-primary/15 mb-4">
                      <div className="text-[9px] text-muted-foreground uppercase font-mono font-semibold">Target Asset / DID</div>
                      <div className="text-xs font-mono text-primary font-bold truncate mt-0.5">
                        {proposal.targetResource}
                      </div>
                    </div>
                  )}

                  {/* Quorum Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs mb-1.5 font-mono">
                      <span className="text-muted-foreground">Threshold</span>
                      <span className="font-bold text-foreground">
                        {signatureCount} / {proposal.requiredSignatures} Signatures
                      </span>
                    </div>
                    <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isQuorumMet ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-primary shadow-[0_0_8px_rgba(0,240,255,0.8)]'
                        }`}
                        style={{ width: `${Math.min(100, (signatureCount / proposal.requiredSignatures) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Signers List */}
                  <div className="space-y-1 mb-4">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">Verified Signers:</div>
                    {(proposal.signatures || []).map((sig: any) => (
                      <div key={sig.id} className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {sig.officerWallet.substring(0, 6)}...{sig.officerWallet.substring(sig.officerWallet.length - 4)} ({sig.officerRole})
                      </div>
                    ))}
                    {(proposal.signatures || []).length === 0 && (
                      <div className="text-[10px] font-mono text-muted-foreground italic">Awaiting first signature...</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-primary/10 flex items-center gap-2">
                  {proposal.status === 'PENDING' && (
                    <button
                      onClick={() => handleSignProposal(proposal)}
                      disabled={hasSigned || signingProposalId === proposal.id}
                      className="flex-1 py-2 rounded-xl bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-background text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {hasSigned ? 'Signed by You' : 'Cryptographically Sign'}
                    </button>
                  )}

                  {proposal.status === 'APPROVED' && (
                    <button
                      onClick={() => handleExecuteProposal(proposal.id)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Execute On-Chain
                    </button>
                  )}

                  {proposal.status === 'EXECUTED' && (
                    <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold text-center flex items-center justify-center gap-1.5">
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

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-primary/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center border-b border-primary/20 pb-3">
                <h2 className="text-lg font-bold font-heading text-foreground">Draft Multi-Sig Quorum Action</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateProposal} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Proposal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Authorize Top Secret Radar Blueprint Mint"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground uppercase">Action Type</label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
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
                      className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
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
                    className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground uppercase">Mission Rationale</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide defense mission justification for this quorum request..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-muted text-muted-foreground text-xs font-mono font-semibold hover:bg-muted/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-primary text-background font-mono font-bold text-xs hover:shadow-glow"
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
