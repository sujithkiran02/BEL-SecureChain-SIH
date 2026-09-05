'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Search, 
  FolderLock, 
  Copy, 
  ArrowRight
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { MintAssetModal } from '@/components/assets/MintAssetModal';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function AssetsPage() {
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              Confidential Asset <span className="text-primary">Vault (NFT)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tokenized defense assets linked to encrypted IPFS payloads and smart contract access rules
          </p>
        </div>

        <button 
          onClick={() => setIsMintModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-medium text-xs transition-all hover:bg-primary/90 shadow-sm shrink-0 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Mint Confidential Asset
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-muted/80 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-2 bg-muted/40 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search by name, ID, division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['ALL', 'TOP_SECRET', 'SECRET', 'RESTRICTED'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClassification(cls)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all shrink-0 ${
                selectedClassification === cls
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredAssets.map((asset, i) => (
          <AnimatedCard 
            key={asset.id} 
            delay={i * 0.05} 
            className="p-5 flex flex-col justify-between rounded-2xl border border-muted/80 dark:border-white/10 bg-card shadow-sm group hover:border-primary/40 transition-all"
          >
            <div>
              {/* Classification Tag & Token ID */}
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  asset.classification === 'TOP_SECRET' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                  asset.classification === 'SECRET' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' :
                  'border-primary/30 text-primary bg-primary/10'
                }`}>
                  {asset.classification}
                </span>

                <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                  Token #{asset.tokenId}
                </span>
              </div>

              {/* Asset Icon & Title */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                  asset.classification === 'TOP_SECRET' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  asset.classification === 'SECRET' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground font-heading group-hover:text-primary transition-colors line-clamp-2">
                    {asset.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{asset.department}</p>
                </div>
              </div>

              {/* IPFS CID Box */}
              <div className="p-2.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted mb-2">
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono mb-0.5">
                  <span>IPFS CID (AES-256)</span>
                  <button 
                    onClick={() => copyHash(asset.uri)} 
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] font-mono text-primary truncate">
                  {asset.uri}
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="p-2.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted mb-3">
                <div className="flex justify-between items-center text-[9px] text-muted-foreground font-mono mb-0.5">
                  <span>SHA-256 PROVENANCE</span>
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
            <div className="pt-3 border-t border-muted/60 dark:border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-muted-foreground">{asset.date}</span>
              <button 
                onClick={() => router.push(`/verify?hash=${asset.sha256}`)}
                className="text-primary hover:underline font-medium flex items-center gap-1"
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
