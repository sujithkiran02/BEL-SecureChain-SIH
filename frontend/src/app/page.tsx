'use client';

import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  FolderLock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Radio,
  Lock,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WalletConnectButton } from '@/components/auth/WalletConnectButton';

export default function Home() {
  const pillars = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-primary" />,
      title: 'Decentralized Identity (DID)',
      description: 'W3C-compliant cryptographic identifiers. Eliminates passwords with Sign-In with Ethereum (SIWE) and Zero-Knowledge verification.',
      route: '/dashboard/identity'
    },
    {
      icon: <FolderLock className="w-5 h-5 text-primary" />,
      title: 'Confidential Asset Vault',
      description: 'Tokenized defense blueprints anchored to EVM smart contracts with AES-256 encrypted IPFS decentralized storage.',
      route: '/dashboard/assets'
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: 'Quorum Multi-Sig Governance',
      description: 'M-of-N cryptographic threshold consensus across authorized defense officers to eliminate unilateral administrative risks.',
      route: '/governance'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Clean Navigation */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-muted/60 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-heading font-bold text-base tracking-tight text-foreground">
              BEL <span className="text-primary">SECURECHAIN</span>
            </span>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              Bharat Electronics Limited
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/verify"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-muted hover:border-primary/40 bg-card text-xs font-medium text-foreground transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            Verify Asset
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="max-w-4xl w-full mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Subtle pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono font-medium tracking-wide mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          DEFENSE ZERO-TRUST PROTOCOL • ACTIVE
        </motion.div>

        {/* Clean, Bold Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold text-foreground tracking-tight leading-[1.12]"
        >
          Zero-Trust Security for <br className="hidden sm:inline" />
          <span className="text-primary">National Defense Assets</span>
        </motion.h1>

        {/* Crisp Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mt-5 leading-relaxed"
        >
          Cryptographic Decentralized Identifiers (DID), smart contract enforced role permissions, IPFS NFT provenance, and multi-party quorum governance.
        </motion.p>

        {/* Action Button Strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3.5"
        >
          <WalletConnectButton />
          
          <Link
            href="/verify"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-muted hover:border-primary/40 bg-card text-foreground text-sm font-medium hover:bg-muted/40 transition-all"
          >
            Public Asset Verification
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        </motion.div>

        {/* 3 Minimal Pillars */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-16 text-left"
        >
          {pillars.map((pillar, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card border border-muted/80 dark:border-white/10 hover:border-primary/40 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  {pillar.icon}
                </div>
                <h3 className="text-sm font-bold font-heading text-foreground mb-1.5">
                  {pillar.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-muted/50 dark:border-white/5 flex items-center justify-between text-xs text-primary font-medium">
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Classic Minimal Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-6 border-t border-muted/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>Bharat Electronics Limited (BEL) • Defense Cyber Security</div>
        <div className="font-mono text-[11px]">Sepolia EVM Protocol v2.4</div>
      </footer>
    </div>
  );
}
