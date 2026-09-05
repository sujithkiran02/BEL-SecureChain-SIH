'use client';

import { motion } from 'framer-motion';
import { 
  Shield, 
  Lock, 
  FileDigit, 
  Activity, 
  Radio, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Terminal, 
  KeyRound, 
  Cpu,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { WalletConnectButton } from '@/components/auth/WalletConnectButton';

export default function Home() {
  const capabilities = [
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: 'Zero-Trust Architecture',
      desc: 'Default-deny verification on every identity, request, and state transition.',
      badge: 'NIST 800-207'
    },
    {
      icon: <Lock className="w-6 h-6 text-accent" />,
      title: 'Decentralized Identifiers (DID)',
      desc: 'W3C compliant cryptographic identities replacing vulnerable static credentials.',
      badge: 'W3C DID'
    },
    {
      icon: <Radio className="w-6 h-6 text-red-400" />,
      title: 'Defense SOC Threat Radar',
      desc: 'Real-time MITRE ATT&CK heuristic anomaly monitoring and circuit breaker containment.',
      badge: 'MITRE ATT&CK'
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      title: 'Quorum Multi-Sig Governance',
      desc: 'M-of-N threshold cryptographic consensus for classified defense operations.',
      badge: 'M-of-N Multi-Sig'
    },
    {
      icon: <FileDigit className="w-6 h-6 text-purple-400" />,
      title: 'NFT Asset Provenance Vault',
      desc: 'Encrypted IPFS-bound tactical assets with tamper-proof blockchain lineage.',
      badge: 'ERC-721 / IPFS'
    },
    {
      icon: <Activity className="w-6 h-6 text-cyan-400" />,
      title: 'Immutable Audit Trail',
      desc: 'Every state change cryptographically anchored to EVM smart contracts.',
      badge: 'EVM Enforced'
    },
  ];

  const telemetryMetrics = [
    { label: 'Security Posture', value: 'DEFCON 5', color: 'text-emerald-400' },
    { label: 'Consensus Latency', value: '< 1.2s', color: 'text-primary' },
    { label: 'Asset Protection', value: 'AES-256-GCM', color: 'text-accent' },
    { label: 'Threat Mitigation', value: 'Automated Lock', color: 'text-red-400' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden cyber-grid">
      {/* Dynamic Background Cyber Grid & Radar Rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sweep Beam */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/80 to-transparent animate-scanline opacity-75" />
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[160px]" />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-30 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <span className="font-heading font-black text-xl tracking-wider text-foreground">
              BEL <span className="text-primary text-glow">SECURECHAIN</span>
            </span>
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Bharat Electronics Limited
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/verify"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-mono font-semibold hover:bg-primary/15 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verify Asset
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 pt-10 pb-20 flex flex-col items-center justify-center">
        {/* Status Chip */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 backdrop-blur-md text-primary text-xs font-mono font-bold tracking-wider mb-8 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          DEFENSE-GRADE ZERO TRUST PLATFORM • ACTIVE
        </motion.div>

        {/* Big Headline */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-center tracking-tight max-w-5xl leading-tight sm:leading-none"
        >
          Securing India&apos;s Defense Assets with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-emerald-400 text-glow">
            Immutable Blockchain Trust
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-xl text-muted-foreground text-center max-w-3xl mt-6 leading-relaxed"
        >
          Decentralized Identifiers (DID), Role-Based Access Enforcement, IPFS NFT Provenance, MITRE ATT&amp;CK Threat SOC, and Multi-Party Quorum Governance engineered for defense operations.
        </motion.p>

        {/* Telemetry Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-10 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary/20 shadow-xl"
        >
          {telemetryMetrics.map((m, i) => (
            <div key={i} className="text-center p-2">
              <div className={`text-lg sm:text-xl font-mono font-black ${m.color}`}>{m.value}</div>
              <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{m.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Wallet Connection & Action CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <WalletConnectButton />
          
          <Link
            href="/verify"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary text-sm font-bold font-mono transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Public Verification Portal
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Capabilities Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mt-20"
        >
          {capabilities.map((cap, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-primary/20 hover:border-primary/50 transition-all duration-300 flex flex-col justify-between group hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] hover:-translate-y-1"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 group-hover:scale-110 transition-transform">
                    {cap.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary">
                    {cap.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                  {cap.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {cap.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-primary/10 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-[11px] group-hover:text-primary transition-colors">Learn more</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer Banner */}
      <footer className="border-t border-primary/15 bg-card/40 backdrop-blur-md py-6 px-8 text-center text-xs font-mono text-muted-foreground">
        Bharat Electronics Limited (BEL) • Defense Cyber Security Division • SIH 2026 Initiative
      </footer>
    </div>
  );
}
