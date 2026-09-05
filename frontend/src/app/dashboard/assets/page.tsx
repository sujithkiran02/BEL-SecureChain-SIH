'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Lock, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  FolderLock, 
  Copy, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { MintAssetModal } from '@/components/assets/MintAssetModal';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AssetsPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [isMintModalOpen, setIsMintModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedClassification, setSelectedClassification] = React.useState('ALL');

  const assets = [
    { 
      id: 1, 
      name: "Swathi Weapon Locating Radar Blueprint", 
      classification: "TOP_SECRET", 
      date: "2026-09-01", 
      uri: "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      tokenId: "1024",
      sha256: "0x8f4d2a1b9c8e7f6d5a4b3c2e1f0d9c8b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c",
      department: "Radar & Weapon Systems Division"
    },
    { 
      id: 2, 
      name: "Naval Sonar Acoustic Target Profiles", 
      classification: "SECRET", 
      date: "2026-08-25", 
      uri: "ipfs://QmZtmD2qtW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uab",
      tokenId: "2048",
      sha256: "0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f",
      department: "Naval Defence Technology Group"
    },
    { 
      id: 3, 
      name: "EVM Hardware Security Module Root Keys", 
      classification: "RESTRICTED", 
      date: "2026-08-10", 
      uri: "ipfs://QmW2WnkFiJnKLwHCnL72vedxjQkDDP1mXWo6ucoQmXoypizj",
      tokenId: "3096",
      sha256: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      department: "Cryptographic Command Center"
    },
    { 
      id: 4, 
      name: "Tactical Combat Communication Network Protocol", 
      classification: "TOP_SECRET", 
      date: "2026-07-30", 
      uri: "ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
      tokenId: "4012",
      sha256: "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d",
      department: "Strategic Communications Wing"
    },
  ];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.tokenId.includes(searchQuery) ||
                          asset.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassification === 'ALL' || asset.classification === selectedClassification;
    return matchesSearch && matchesClass;
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Asset SHA-256 Hash copied to clipboard');
  };

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
              Confidential Asset <span className="text-primary text-glow">Vault (NFT)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tokenized defense assets linked to encrypted IPFS payloads and smart contract access rules
          </p>
        </div>

        <button 
          onClick={() => setIsMintModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-background px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Mint Confidential Asset (NFT)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card/50 backdrop-blur-xl p-4 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-2 bg-background/60 border border-primary/20 rounded-xl px-3 py-2 w-full md:w-96">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by asset name, Token ID, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {['ALL', 'TOP_SECRET', 'SECRET', 'RESTRICTED'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassification(cls)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                selectedClassification === cls
                  ? 'bg-primary text-background shadow-glow'
                  : 'bg-background/40 text-muted-foreground border border-primary/10 hover:border-primary/30'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset, i) => (
          <AnimatedCard 
            key={asset.id} 
            delay={i * 0.08} 
            className={`p-6 flex flex-col justify-between rounded-2xl border bg-card/60 backdrop-blur-xl relative overflow-hidden group hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] ${
              asset.classification === 'TOP_SECRET' ? 'border-red-500/30' :
              asset.classification === 'SECRET' ? 'border-amber-500/30' :
              'border-primary/30'
            }`}
          >
            <div>
              {/* Classification Tag & Token ID */}
              <div className="flex items-start justify-between mb-4">
                <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                  asset.classification === 'TOP_SECRET' ? 'border-red-500/50 text-red-400 bg-red-500/15' :
                  asset.classification === 'SECRET' ? 'border-amber-500/50 text-amber-400 bg-amber-500/15' :
                  'border-primary/50 text-primary bg-primary/15'
                }`}>
                  {asset.classification}
                </span>

                <span className="text-xs font-mono text-muted-foreground bg-background/60 px-2.5 py-1 rounded-lg border border-primary/15">
                  Token #{asset.tokenId}
                </span>
              </div>

              {/* Asset Icon & Title */}
              <div className="flex items-start gap-3.5 mb-3">
                <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 ${
                  asset.classification === 'TOP_SECRET' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  asset.classification === 'SECRET' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-primary/10 border-primary/30 text-primary'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground font-heading group-hover:text-primary transition-colors line-clamp-2">
                    {asset.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{asset.department}</p>
                </div>
              </div>

              {/* IPFS CID Box */}
              <div className="p-2.5 rounded-xl bg-background/50 border border-primary/15 mb-3">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono mb-1">
                  <span>IPFS STORAGE CID (AES-256)</span>
                  <button 
                    onClick={() => copyHash(asset.uri)} 
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[11px] font-mono text-primary truncate">
                  {asset.uri}
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="p-2.5 rounded-xl bg-background/50 border border-primary/15 mb-4">
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono mb-1">
                  <span>PROVENANCE SHA-256 HASH</span>
                  <button 
                    onClick={() => copyHash(asset.sha256)} 
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground truncate">
                  {asset.sha256}
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-3 border-t border-primary/10 flex items-center justify-between text-xs font-mono">
              <span className="text-[11px] text-muted-foreground">Minted: {asset.date}</span>
              <button 
                onClick={() => router.push(`/verify?hash=${asset.sha256}`)}
                className="text-primary hover:text-primary/80 font-bold flex items-center gap-1 hover:underline"
              >
                Verify Hash &rarr;
              </button>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <MintAssetModal 
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
      />
    </div>
  );
}
