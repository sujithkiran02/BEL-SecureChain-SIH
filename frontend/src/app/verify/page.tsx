'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Search, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function VerificationPortal() {
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hash.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`http://localhost:3001/api/verify/${hash.trim()}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ verified: false, message: 'Failed to connect to verification network.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
      <div className="absolute inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <ShieldCheck className="w-16 h-16 text-primary mb-6 shadow-glow drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
        <h1 className="text-4xl font-bold mb-4 text-center">BEL SecureChain Verification</h1>
        <p className="text-muted-foreground text-center mb-8 max-w-md">
          Verify the authenticity and integrity of any BEL digital asset by entering its SHA-256 cryptographic hash.
        </p>

        <AnimatedCard className="w-full p-2 bg-card/50 backdrop-blur-xl border-primary/20 flex shadow-[0_0_30px_rgba(0,240,255,0.1)]">
          <form onSubmit={handleVerify} className="flex w-full">
            <div className="flex items-center pl-4 pr-2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="Enter SHA-256 Hash (0x...)"
              className="flex-1 bg-transparent outline-none text-foreground px-2 py-4 font-mono text-sm placeholder:text-muted-foreground/50"
            />
            <button 
              type="submit"
              disabled={loading || !hash.trim()}
              className="bg-primary/20 hover:bg-primary hover:text-background text-primary border border-primary/50 font-bold px-8 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed m-1 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
            </button>
          </form>
        </AnimatedCard>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-8"
          >
            <AnimatedCard className={`p-6 border-2 ${result.verified ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
              <div className="flex items-start gap-4">
                {result.verified ? (
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  <h2 className={`text-xl font-bold mb-2 ${result.verified ? 'text-green-400' : 'text-red-400'}`}>
                    {result.verified ? 'Authentic Asset Verified' : 'Verification Failed'}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    {result.message}
                  </p>

                  {result.details && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-muted/20">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Token ID:</span>
                        <span className="font-mono text-foreground font-bold">{result.details.tokenId}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Owner Wallet:</span>
                        <span className="font-mono text-primary truncate max-w-[200px]" title={result.details.ownerWallet}>
                          {result.details.ownerWallet}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Owner Verified Status:</span>
                        {result.details.isOwnerVerified ? (
                          <span className="text-green-400 font-bold text-xs bg-green-500/20 px-2 py-0.5 rounded">VERIFIED</span>
                        ) : (
                          <span className="text-yellow-400 font-bold text-xs bg-yellow-500/20 px-2 py-0.5 rounded">PENDING</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
