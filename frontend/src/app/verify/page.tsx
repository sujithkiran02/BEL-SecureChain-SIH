'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ArrowLeft, 
  Copy, 
  Lock, 
  Check,
  Shield,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { toast } from 'sonner';

export default function VerificationPortal() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Check URL parameters for preset hash
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
    { label: 'Swathi Radar Blueprint', hash: '0x8f4d2a1b9c8e7f6d5a4b3c2e1f0d9c8b7a6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c' },
    { label: 'Naval Sonar Acoustic Profile', hash: '0x3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f' },
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-between p-6 md:p-10 relative overflow-hidden cyber-grid">
      {/* Dynamic Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-20 max-w-5xl w-full flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-primary/25 bg-card/60 text-foreground hover:text-primary text-xs font-mono font-bold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Command Center
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Verification Console */}
      <main className="relative z-10 w-full max-w-3xl flex flex-col items-center my-auto py-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] mb-6">
          <ShieldCheck className="w-9 h-9 text-primary animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-heading font-black text-center tracking-tight mb-2">
          Public Asset <span className="text-primary text-glow">Verification Portal</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground text-center mb-8 max-w-xl leading-relaxed">
          Verify the authenticity, classification, and tamper-proof blockchain lineage of any BEL confidential asset using its SHA-256 hash.
        </p>

        {/* Verification Input Box */}
        <AnimatedCard className="w-full p-2 bg-card/70 backdrop-blur-2xl border-primary/30 flex shadow-[0_0_40px_rgba(0,240,255,0.15)] rounded-2xl">
          <form onSubmit={handleVerify} className="flex w-full items-center">
            <div className="flex items-center pl-4 pr-2 text-muted-foreground">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <input 
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Paste SHA-256 Cryptographic Hash (0x...)"
              className="flex-1 bg-transparent outline-none text-foreground px-2 py-3.5 font-mono text-xs sm:text-sm placeholder:text-muted-foreground/50"
            />
            <button 
              type="submit"
              disabled={loading || !hash.trim()}
              className="bg-primary hover:bg-primary/90 text-background font-mono font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed m-1 flex items-center gap-2 text-xs shadow-glow"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Asset'}
            </button>
          </form>
        </AnimatedCard>

        {/* Quick Sample Hashes for Judges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Sample Defense Assets:</span>
          {sampleHashes.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setHash(s.hash);
                verifyHash(s.hash);
              }}
              className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/15 text-primary transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Result Card */}
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-8"
          >
            <AnimatedCard className={`p-6 border-2 rounded-2xl backdrop-blur-2xl ${
              result.verified ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-500/50 bg-red-500/5'
            }`}>
              <div className="flex items-start gap-4">
                {result.verified ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(255,0,85,0.4)]">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-bold font-heading ${result.verified ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.verified ? 'Authentic Defense Asset Verified' : 'Cryptographic Verification Failed'}
                    </h2>
                    {result.verified && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        IMMUTABLE
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground text-xs mt-1">
                    {result.message || (result.verified ? 'Asset signature and payload are formally verified in the smart contract registry.' : 'The entered hash does not match any registered asset.')}
                  </p>

                  {result.details && (
                    <div className="space-y-2.5 mt-5 pt-4 border-t border-primary/10 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Token ID:</span>
                        <span className="text-foreground font-bold font-mono">#{result.details.tokenId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Owner Wallet / DID:</span>
                        <span className="text-primary truncate max-w-[220px]" title={result.details.ownerWallet}>
                          {result.details.ownerWallet}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Officer Clearance:</span>
                        {result.details.isOwnerVerified ? (
                          <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                            VALIDATED DEFENSE CLEARANCE
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
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
      <footer className="relative z-10 text-center text-[11px] font-mono text-muted-foreground">
        Bharat Electronics Limited • Defense Cryptographic Verification Node
      </footer>
    </div>
  );
}
