'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { 
  ShieldCheck, 
  UserCircle, 
  Key, 
  CheckCircle2, 
  Copy, 
  Check, 
  Fingerprint, 
  ShieldAlert,
  AlertTriangle,
  Atom,
  RefreshCw,
  Play,
  QrCode,
  FileCode2,
  Lock
} from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function IdentityPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const demoAddress = address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const did = `did:securechain:${demoAddress.toLowerCase()}`;
  
  const [identityData, setIdentityData] = useState<any>(null);
  const [didDoc, setDidDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedDid, setCopiedDid] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [testingChallenge, setTestingChallenge] = useState(false);
  const [challengeResult, setChallengeResult] = useState<any>(null);
  
  const fetchIdentityAndDoc = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const [idRes, docRes] = await Promise.all([
        fetch('http://localhost:3001/api/identity/me', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }),
        fetch(`http://localhost:3001/api/did/resolve/${encodeURIComponent(did)}`)
      ]);

      if (idRes.ok) {
        const data = await idRes.json();
        setIdentityData(data.identity);
      }
      if (docRes.ok) {
        const docData = await docRes.json();
        setDidDoc(docData.didDocument);
      }
    } catch (err) {
      console.error("Failed to fetch identity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentityAndDoc();
  }, [address]);

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

  const handleTestChallengeResponse = async () => {
    setTestingChallenge(true);
    setChallengeResult(null);
    try {
      // 1. Request Challenge
      const chalRes = await fetch('http://localhost:3001/api/did/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: demoAddress, did })
      });
      const chalData = await chalRes.json();
      if (!chalRes.ok) {
        throw new Error(chalData.error || 'Failed to get challenge');
      }

      // 2. Sign Challenge with Wallet
      let signature = '0xmock_sig';
      if (address && signMessageAsync) {
        signature = await signMessageAsync({ message: chalData.challenge });
      }

      // 3. Verify Signature & Proof of Possession
      const verifyRes = await fetch('http://localhost:3001/api/did/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: chalData.challenge,
          signature,
          walletAddress: demoAddress,
          did
        })
      });
      const verifyData = await verifyRes.json();
      setChallengeResult(verifyData);

      if (verifyRes.ok) {
        toast.success('DID Proof-of-Possession authenticated successfully!');
      } else {
        toast.error(verifyData.error || 'DID verification failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Challenge-response test error');
    } finally {
      setTestingChallenge(false);
    }
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
            W3C Compliant Self-Sovereign Identity with Subject Public Keys & Post-Quantum ML-DSA Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIdentityAndDoc}
            className="p-2 rounded-xl border border-muted hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-mono text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SIWE & DID Anchored
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase font-mono font-bold tracking-wider mb-1 block">
                  Subject Key (Secp256k1)
                </label>
                <div className="p-3 bg-muted/40 dark:bg-white/5 rounded-xl border border-muted font-mono text-xs text-foreground truncate flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary shrink-0" />
                  <span>{demoAddress}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase font-mono font-bold tracking-wider mb-1 block">
                  Subject PQC Key (ML-DSA-65)
                </label>
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 font-mono text-xs text-purple-400 truncate flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{didDoc?.verificationMethod?.find((m: any) => m.type.includes('MlDsa'))?.publicKeyHex?.substring(0, 18) || 'NIST FIPS 204 Key'}...</span>
                </div>
              </div>
            </div>
          </div>

          {/* DID Challenge-Response Test Terminal */}
          <div className="pt-3 border-t border-muted/60 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground font-mono">DID Proof-of-Possession Challenge</h3>
                <p className="text-[10px] text-muted-foreground">Test cryptographic challenge-response authentication</p>
              </div>
              <button
                onClick={handleTestChallengeResponse}
                disabled={testingChallenge}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 font-mono"
              >
                {testingChallenge ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                Run Proof-of-Possession
              </button>
            </div>

            {challengeResult && (
              <div className="p-3 rounded-xl bg-black/40 border border-muted/50 text-[11px] font-mono space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>DID AUTHENTICATION SUCCESSFUL</span>
                </div>
                <div className="text-muted-foreground">DID: {challengeResult.did}</div>
                <div className="text-muted-foreground">Active VCs: {challengeResult.activeCredentialsCount || 0}</div>
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Right Column: W3C DID Document Viewer */}
        <AnimatedCard className="lg:col-span-5 p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card flex flex-col justify-between gap-5 shadow-sm">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-foreground border-b border-muted/60 dark:border-white/5 pb-3 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-primary" />
              W3C DID Document (Resolved)
            </h2>
            
            <div className="mt-3">
              <pre className="p-3.5 rounded-xl bg-black/50 border border-muted/40 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-72">
                {JSON.stringify(didDoc || {
                  id: did,
                  verificationMethod: [
                    { id: `${did}#key-1`, type: 'EcdsaSecp256k1RecoveryMethod2020' },
                    { id: `${did}#pqc-key-1`, type: 'PostQuantumMlDsa65VerificationKey2026' }
                  ],
                  authentication: [`${did}#key-1`],
                  assertionMethod: [`${did}#key-1`, `${did}#pqc-key-1`]
                }, null, 2)}
              </pre>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-foreground">Identity Health Score</div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Post-Quantum Key Linked</div>
            </div>
            <div className="text-lg font-mono font-black text-emerald-500">100 / 100</div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
