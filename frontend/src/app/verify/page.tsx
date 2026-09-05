'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Copy, 
  Check
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function VerificationPortal() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParam = urlParams.get('hash');
      if (hashParam) {
        setHash(hashParam);
        verifyHash(hashParam);
      }
    }
  }, []);

  const sampleHashes = [
    { label: 'Swathi Radar', hash: '0x8f4d2a1b9c8e7f6d5a4b3c2e1f0d9c8b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c' },
    { label: 'Naval Sonar', hash: '0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f' },
    { label: 'EVM Root Keys', hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' },
  ];

  const verifyHash = async (hashToVerify: string) => {
    if (!hashToVerify.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:3001/api/verify/${hashToVerify.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ 
        verified: false, 
        message: 'Cryptographic hash not matched in on-chain AssetNFT registry or IPFS index.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    verifyHash(hash);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-muted bg-card hover:border-primary/40 text-xs font-medium text-foreground transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Verification Console */}
      <main className="w-full max-w-2xl mx-auto flex flex-col items-center my-8 sm:my-auto">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary shadow-sm">
          <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold text-center tracking-tight mb-2">
          Asset <span className="text-primary">Verification Portal</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6 max-w-lg leading-relaxed px-2">
          Verify the authenticity and on-chain provenance of any BEL confidential asset by entering its SHA-256 hash.
        </p>

        {/* Verification Input Box */}
        <AnimatedCard className="w-full p-2 bg-card border border-muted/80 dark:border-white/10 rounded-2xl shadow-sm">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row w-full items-stretch sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center pl-3 pr-2 text-muted-foreground hidden sm:flex">
              <Search className="w-4 h-4 text-primary" />
            </div>
            <input 
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Paste SHA-256 Hash (0x...)"
              className="flex-1 bg-transparent outline-none text-foreground px-3 py-2.5 sm:py-3 font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50 min-w-0"
            />
            <button 
              type="submit"
              disabled={loading || !hash.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 py-2.5 sm:py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs shrink-0 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </form>
        </AnimatedCard>

        {/* Quick Sample Hashes */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-4 w-full px-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Sample:</span>
          {sampleHashes.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setHash(s.hash);
                verifyHash(s.hash);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-muted bg-card hover:border-primary/40 text-muted-foreground hover:text-primary transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Result Card */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6"
          >
            <AnimatedCard className={`p-5 sm:p-6 border rounded-2xl ${
              result.verified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
            }`}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {result.verified ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 text-red-500" />
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden min-w-0 w-full">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-base font-bold font-heading ${result.verified ? 'text-emerald-500' : 'text-red-500'}`}>
                      {result.verified ? 'Authentic Asset Verified' : 'Verification Failed'}
                    </h2>
                    {result.verified && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                        IMMUTABLE
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-xs mt-1">
                    {result.message || (result.verified ? 'Asset signature and payload are formally verified in the smart contract registry.' : 'The entered hash does not match any registered asset.')}
                  </p>

                  {result.details && (
                    <div className="space-y-2 mt-4 pt-3 border-t border-muted font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Token ID:</span>
                        <span className="text-foreground font-bold">#{result.details.tokenId}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-muted-foreground">Owner Wallet / DID:</span>
                        <span className="text-primary truncate max-w-full sm:max-w-[220px]" title={result.details.ownerWallet}>
                          {result.details.ownerWallet}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-muted-foreground">Officer Clearance:</span>
                        {result.details.isOwnerVerified ? (
                          <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            VALIDATED CLEARANCE
                          </span>
                        ) : (
                          <span className="text-amber-500 font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            PENDING VALIDATION
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-auto mx-auto text-center text-[11px] font-mono text-muted-foreground">
        Bharat Electronics Limited • Defense Cryptographic Verification Node
      </footer>
    </div>
  );
}
