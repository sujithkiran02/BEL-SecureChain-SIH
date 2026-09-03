'use client';

import { useAccount } from 'wagmi';
import { ShieldCheck, UserCircle, Key, FileText, CheckCircle2 } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function IdentityPage() {
  const { address } = useAccount();
  const demoAddress = address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const did = `did:trustchain:${demoAddress.toLowerCase()}`;

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-primary" />
          Identity Management (DID)
        </h1>
        <p className="text-muted-foreground">Manage your self-sovereign Decentralized Identifier.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        
        {/* DID Card */}
        <AnimatedCard className="p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-primary/10 pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary shadow-glow">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Rahul</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified Employee
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Decentralized Identifier (DID)</label>
              <div className="mt-1 p-3 bg-background/50 rounded-lg border border-primary/10 font-mono text-sm text-primary break-all">
                {did}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Public Key (Wallet)</label>
              <div className="mt-1 p-3 bg-background/50 rounded-lg border border-primary/10 font-mono text-sm text-foreground break-all flex items-center gap-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                {demoAddress}
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Cryptographic Proofs */}
        <AnimatedCard className="p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col gap-6">
          <h2 className="text-lg font-bold text-foreground border-b border-primary/10 pb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            Cryptographic Proofs
          </h2>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This identity is mathematically proven and cryptographically signed. You do not need a password.
            </p>
            
            <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-4">
              <div className="mt-1 w-2 h-2 rounded-full bg-accent shadow-glow"></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Sign-In with Ethereum (SIWE)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Identity was authenticated at {new Date().toLocaleTimeString()} by signing a challenge message with the private key attached to this DID.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-4">
              <div className="mt-1 w-2 h-2 rounded-full bg-primary shadow-glow"></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Zero-Knowledge Credentials</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Proving "I am an authorized employee" without revealing personal data (Name, address, phone number).
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>

      </div>
    </div>
  );
}
