'use client';

import { FileCode2, Network, CheckCircle2, Zap, Copy, ExternalLink, Cpu, Layers } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { toast } from 'sonner';

export default function SmartContractsPage() {
  const contracts = [
    {
      name: "IdentityRegistry.sol",
      address: "0x7a2b0286392d4e21948834927161b2394d5e9812",
      description: "Manages Decentralized Identifiers (DIDs), public keys, and cryptographic revocation status.",
      methods: ["registerIdentity()", "verifyIdentity()", "revokeIdentity()", "getDIDDocument()"],
      status: "Operational",
      network: "Sepolia Testnet",
      gasUsed: "42,180"
    },
    {
      name: "AccessControlManager.sol",
      address: "0x9d8e34891b2c457891238901238471921b2c5541",
      description: "Enforces 4-tier RBAC rules and mathematical permission validation on EVM bytecode.",
      methods: ["grantRole()", "revokeRole()", "hasRole()", "validateAccess()"],
      status: "Operational",
      network: "Sepolia Testnet",
      gasUsed: "31,450"
    },
    {
      name: "AssetNFT.sol",
      address: "0x1a2b5e6f8812349012384910283941025e6f7723",
      description: "ERC-721 contract linking off-chain AES-256 IPFS metadata to on-chain identities.",
      methods: ["mintConfidentialAsset()", "transferAsset()", "burnAsset()", "tokenURI()"],
      status: "Operational",
      network: "Sepolia Testnet",
      gasUsed: "68,920"
    },
    {
      name: "AuditLog.sol",
      address: "0x4c5d8a9b1928374659102938475610298a9b6619",
      description: "Immutable event logger for Identity, Asset, Role, and Security Incident telemetry.",
      methods: ["logEvent()", "getEventCount()", "getEventTimeline()"],
      status: "Operational",
      network: "Sepolia Testnet",
      gasUsed: "28,300"
    },
    {
      name: "QuorumGovernance.sol",
      address: "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a",
      description: "M-of-N multi-signature consensus engine preventing unilateral defense state updates.",
      methods: ["createProposal()", "signProposal()", "executeProposal()", "getThreshold()"],
      status: "Operational",
      network: "Sepolia Testnet",
      gasUsed: "54,200"
    }
  ];

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Contract address copied');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
              Smart Contracts <span className="text-primary text-glow">&amp; EVM Logic</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Deployed defense smart contracts powering zero-trust enforcement, identity, and governance
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          5 / 5 Contracts Verified
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contracts.map((contract, idx) => (
          <AnimatedCard 
            key={contract.name} 
            delay={idx * 0.08}
            className="p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col justify-between rounded-2xl group hover:border-primary/50 transition-all hover:shadow-[0_0_25px_rgba(0,240,255,0.15)]"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/25">
                  <FileCode2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                  {contract.status}
                </span>
              </div>

              <h2 className="text-base font-bold text-foreground font-mono group-hover:text-primary transition-colors">
                {contract.name}
              </h2>

              <div 
                onClick={() => copyAddress(contract.address)}
                className="my-3 p-2.5 rounded-xl bg-background/50 border border-primary/15 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors group/addr"
                title="Click to copy address"
              >
                <span className="text-[11px] font-mono text-primary truncate">
                  {contract.address.substring(0, 10)}...{contract.address.substring(contract.address.length - 8)}
                </span>
                <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover/addr:text-primary transition-colors" />
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {contract.description}
              </p>

              <div>
                <div className="text-[10px] uppercase font-mono text-muted-foreground font-bold tracking-wider mb-2">
                  Key Interface Methods
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {contract.methods.map((m, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/40 border border-primary/10 text-muted-foreground">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-5 border-t border-primary/10 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="text-accent flex items-center gap-1">
                <Network className="w-3.5 h-3.5" />
                {contract.network}
              </span>
              <span>Avg Gas: {contract.gasUsed}</span>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Engine Status Banner */}
      <AnimatedCard className="p-6 border border-accent/20 bg-card/60 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/40 shadow-[0_0_20px_rgba(56,189,248,0.3)] shrink-0">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Deterministic EVM Execution Engine</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All state transitions are formally verified, isolated, and permanently recorded on the blockchain ledger.
            </p>
          </div>
        </div>
        <div className="px-4 py-2 bg-background/80 border border-primary/30 rounded-xl text-xs font-mono font-bold text-primary shadow-glow shrink-0">
          STATUS: 100% OPERATIONAL
        </div>
      </AnimatedCard>
    </div>
  );
}
