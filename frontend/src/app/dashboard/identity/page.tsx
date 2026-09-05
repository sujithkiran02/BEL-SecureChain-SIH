'use client';

import { useAccount } from 'wagmi';
import { 
  ShieldCheck, 
  UserCircle, 
  Key, 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  QrCode, 
  Lock, 
  Fingerprint, 
  Cpu, 
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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
              Decentralized Identity <span className="text-primary text-glow">(DID)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            W3C Compliant Self-Sovereign Identity and Cryptographic Role Clearances
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SIWE Authenticated
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: DID Document & Wallet Anchor (Col 7) */}
        <AnimatedCard className="lg:col-span-7 p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col gap-6">
          {/* Identity Header */}
          <div className="flex items-center gap-4 border-b border-primary/10 pb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center border-2 border-primary shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Fingerprint className="w-9 h-9 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-heading text-foreground">Officer Identity Record</h2>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                  EVM ANCHOR
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {loading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Verifying cryptographic state...</span>
                ) : identityData ? (
                  <>
                    {identityData.isVerified ? (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/40 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" /> VERIFIED ON-CHAIN
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/40 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3 h-3" /> PENDING VALIDATION
                      </span>
                    )}
                    
                    {identityData.isRevoked && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded-full font-bold border border-red-500/40 flex items-center gap-1 font-mono">
                        <ShieldAlert className="w-3 h-3" /> REVOKED
                      </span>
                    )}
                    
                    {identityData.roles?.map((r: any) => (
                      <span key={r.role} className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/40 font-mono">
                        {r.role}
                      </span>
                    ))}
                  </>
                ) : (
                  <span className="text-xs bg-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold border border-primary/40 font-mono">
                    ADMIN_CLEARANCE (DEMO)
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
                  {copiedDid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedDid ? 'Copied' : 'Copy DID'}
                </button>
              </div>
              <div className="p-3.5 bg-background/60 rounded-xl border border-primary/20 font-mono text-xs text-primary break-all shadow-inner">
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
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copied' : 'Copy Key'}
                </button>
              </div>
              <div className="p-3.5 bg-background/60 rounded-xl border border-primary/20 font-mono text-xs text-foreground break-all flex items-center gap-2 shadow-inner">
                <Key className="w-4 h-4 text-primary shrink-0" />
                <span>{demoAddress}</span>
              </div>
            </div>
          </div>

          {/* Defense Attestation Metadata */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-primary/10">
            <div className="p-3 rounded-xl bg-background/40 border border-primary/15">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Registry Smart Contract</div>
              <div className="text-xs font-mono text-primary font-bold mt-1 truncate">IdentityRegistry.sol</div>
            </div>
            <div className="p-3 rounded-xl bg-background/40 border border-primary/15">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">Signature Algorithm</div>
              <div className="text-xs font-mono text-foreground font-bold mt-1">ECDSA (Keccak-256)</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Right Column: Cryptographic Proofs & Security Posture (Col 5) */}
        <AnimatedCard className="lg:col-span-5 p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold font-heading text-foreground border-b border-primary/10 pb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              Cryptographic Proof Timeline
            </h2>
            
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/25 flex items-start gap-3.5">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(56,189,248,0.8)] shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">1. Sign-In with Ethereum (SIWE)</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    EIP-4361 cryptographically validated session signature. No plaintext passwords stored.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/25 flex items-start gap-3.5">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,240,255,0.8)] shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">2. Zero-Knowledge Credential Proof</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Mathematical proof of defense operational clearance without disclosing personal identifier data.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/25 flex items-start gap-3.5">
                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0"></div>
                <div>
                  <h3 className="text-xs font-bold text-foreground font-mono">3. On-Chain Immutability Lock</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    DID state is indexed in Sepolia EVM storage. Tamper-evident against rogue DB modifications.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card/80 border border-primary/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">Identity Health Score</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Hardware Key Authenticated</div>
            </div>
            <div className="text-xl font-mono font-black text-emerald-400">98 / 100</div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
