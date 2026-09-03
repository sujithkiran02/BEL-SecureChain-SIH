'use client';

import { FileCode2, Network, CheckCircle2, Zap } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function SmartContractsPage() {
  const contracts = [
    {
      name: "IdentityRegistry.sol",
      address: "0x7a2b...4d5e",
      description: "Manages Decentralized Identifiers (DIDs) and public key mappings.",
      status: "Active",
      network: "Sepolia Testnet"
    },
    {
      name: "AccessControlManager.sol",
      address: "0x9d8e...1b2c",
      description: "Enforces 4-tier RBAC rules and permission validation.",
      status: "Active",
      network: "Sepolia Testnet"
    },
    {
      name: "AssetNFT.sol",
      address: "0x1a2b...5e6f",
      description: "ERC-721 contract linking off-chain IPFS metadata to on-chain identities.",
      status: "Active",
      network: "Sepolia Testnet"
    },
    {
      name: "AuditLog.sol",
      address: "0x4c5d...8a9b",
      description: "Immutable event logger for Identity, Asset, and Access operations.",
      status: "Active",
      network: "Sepolia Testnet"
    }
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <FileCode2 className="w-8 h-8 text-primary" />
          Smart Contracts
        </h1>
        <p className="text-muted-foreground">Monitor the core logic deployed on the blockchain.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {contracts.map((contract) => (
          <AnimatedCard key={contract.name} className="p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-foreground font-mono">{contract.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded border border-primary/10">
                    {contract.address}
                  </span>
                </div>
              </div>
              <div className="bg-primary/10 text-primary p-2 rounded-lg border border-primary/20">
                <FileCode2 className="w-5 h-5" />
              </div>
            </div>

            <p className="text-sm text-muted-foreground flex-1">
              {contract.description}
            </p>

            <div className="flex items-center gap-4 border-t border-primary/10 pt-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {contract.status}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-accent font-bold">
                <Network className="w-4 h-4" />
                {contract.network}
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <AnimatedCard className="mt-4 p-6 border border-accent/20 bg-accent/5 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Contract Execution Engine</h3>
            <p className="text-sm text-muted-foreground">All logic is deterministic and verified on the Ethereum Virtual Machine (EVM).</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-background border border-primary/20 rounded-lg text-sm font-mono text-primary shadow-glow">
          Status: Operational
        </div>
      </AnimatedCard>
    </div>
  );
}
