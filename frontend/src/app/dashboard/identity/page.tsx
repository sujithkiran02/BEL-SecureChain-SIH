'use client';

import { useAccount } from 'wagmi';
import { 
  ShieldCheck, 
  UserCircle, 
  Key, 
  CheckCircle2, 
  Copy, 
  Check, 
  Fingerprint, 
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function IdentityPage() {
  const { address } = useAccount();
  const demoAddress = address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const did = `did:bel:${demoAddress.toLowerCase()}`;
  
  const [identityData, setIdentityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedDid, setCopiedDid] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  useEffect(() => {
    const fetchIdentity = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:3001/api/identity/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIdentityData(data.identity);
        }
      } catch (err) {
        console.error("Failed to fetch identity:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdentity();
  }, []);

  const copyDid = () => {
    navigator.clipboard.writeText(did);
    setCopiedDid(true);
    toast.success('DID URI copied to clipboard');
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(demoAddress);
    setCopiedKey(true);
    toast.success('Public Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              Decentralized Identity <span className="text-primary">(DID)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            W3C Compliant Self-Sovereign Identity and Cryptographic Role Clearances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SIWE Authenticated
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: DID Document & Wallet Anchor */}
        <AnimatedCard className="lg:col-span-7 p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card flex flex-col gap-5 shadow-sm">
          {/* Identity Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 border-b border-muted/60 dark:border-white/5 pb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Fingerprint className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold font-heading text-foreground">Officer Identity Record</h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  EVM ANCHOR
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5">
                {loading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Verifying state...</span>
                ) : identityData ? (
                  <>
                    {identityData.isVerified ? (
                      <span className="text-[11px] bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED ON-CHAIN
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3" /> PENDING
                      </span>
                    )}
                    
                    {identityData.isRevoked && (
                      <span className="text-[11px] bg-red-500/10 text-red-500 px-2.5 py-0.5 rounded-full font-bold border border-red-500/20 flex items-center gap-1 font-mono">
                        <ShieldAlert className="w-3 h-3" /> REVOKED
                      </span>
                    )}
                    
                    {identityData.roles?.map((r: any) => (
                      <span key={r.role} className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/20 font-mono">
                        {r.role}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/20 font-mono">
                    ADMIN_CLEARANCE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DID Document Fields */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-muted-foreground uppercase font-mono font-bold tracking-wider">
                  Decentralized Identifier (DID)
                </label>
                <button
                  onClick={copyDid}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedDid ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedDid ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 bg-muted/40 dark:bg-white/5 rounded-xl border border-muted font-mono text-xs text-primary break-all">
                {did}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-muted-foreground uppercase font-mono font-bold tracking-wider">
                  Public Key (Secp256k1 Controller)
                </label>
                <button
                  onClick={copyKey}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-3 bg-muted/40 dark:bg-white/5 rounded-xl border border-muted font-mono text-xs text-foreground break-all flex items-center gap-2">
                <Key className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate sm:break-all">{demoAddress}</span>
              </div>
            </div>
          </div>

          {/* Defense Attestation Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-muted/60 dark:border-white/5">
            <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Registry Smart Contract</div>
              <div className="text-xs font-mono text-primary font-bold mt-0.5 truncate">IdentityRegistry.sol</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Signature Algorithm</div>
              <div className="text-xs font-mono text-foreground font-bold mt-0.5">ECDSA (Keccak-256)</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Right Column: Cryptographic Proofs */}
        <AnimatedCard className="lg:col-span-5 p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card flex flex-col justify-between gap-5 shadow-sm">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-foreground border-b border-muted/60 dark:border-white/5 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Cryptographic Proof Timeline
            </h2>
            
            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">1. Sign-In with Ethereum (SIWE)</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    EIP-4361 cryptographically validated session signature. No plaintext passwords stored.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">2. Zero-Knowledge Proof (ZKP)</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Mathematical proof of defense clearance without disclosing personal identifier data.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">3. On-Chain Immutability Lock</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    DID state is permanently indexed in Sepolia EVM storage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">Identity Health Score</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Hardware Key Authenticated</div>
            </div>
            <div className="text-lg font-mono font-black text-emerald-500">98 / 100</div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
