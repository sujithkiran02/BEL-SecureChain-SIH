'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Lock } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { MintAssetModal } from '@/components/assets/MintAssetModal';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

export default function AssetsPage() {
  const { address } = useAccount();
  const router = useRouter();
  const [isMintModalOpen, setIsMintModalOpen] = React.useState(false);

  // Mock data for UI demonstration
  const assets = [
    { id: 1, name: "Swathi WLR Blueprint", classification: "Top Secret", date: "2026-09-01", uri: "ipfs://Qm..." },
    { id: 2, name: "EVM Cryptographic Keys", classification: "Restricted", date: "2026-08-25", uri: "ipfs://Qm..." },
    { id: 3, name: "Naval Sonar Specifications", classification: "Secret", date: "2026-08-10", uri: "ipfs://Qm..." },
  ];

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-8 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Digital Assets</h1>
          <p className="text-muted-foreground">Manage and track your tokenized confidential documents.</p>
        </div>
        <button 
          onClick={() => setIsMintModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold transition-all hover:bg-primary/90 hover:shadow-glow hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Mint New Asset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset, i) => (
          <AnimatedCard key={asset.id} delay={i * 0.1} className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${
                asset.classification === 'Top Secret' ? 'border-destructive text-destructive bg-destructive/10' :
                asset.classification === 'Secret' ? 'border-amber-500 text-amber-500 bg-amber-500/10' :
                'border-primary text-primary bg-primary/10'
              }`}>
                {asset.classification}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-1">{asset.name}</h3>
            <p className="text-sm text-muted-foreground mb-6 font-mono truncate">{asset.uri}</p>
            
            <div className="mt-auto pt-4 border-t border-muted/50 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Minted: {asset.date}</span>
              <button 
                onClick={() => router.push('/dashboard/logs')}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                View Logs
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
