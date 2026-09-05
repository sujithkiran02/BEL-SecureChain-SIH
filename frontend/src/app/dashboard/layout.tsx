'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  FolderLock,
  FileCode2,
  History,
  ShieldAlert,
  Users,
  CheckCircle2,
  Radio,
  LogOut,
  Bell,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Flame,
  KeyRound
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  isExternal?: boolean;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: 'CORE PLATFORM',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
      { href: '/dashboard/identity', label: 'Decentralized ID (DID)', icon: UserCircle },
      { href: '/dashboard/rbac', label: 'Access Control (RBAC)', icon: ShieldCheck },
      { href: '/dashboard/assets', label: 'Asset Vault (NFT)', icon: FolderLock },
    ],
  },
  {
    title: 'DEFENSE & THREAT INTEL',
    items: [
      { href: '/soc', label: 'SOC Threat Radar', icon: Radio, badge: 'LIVE', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' },
      { href: '/governance', label: 'Quorum Governance', icon: Users, badge: 'M-of-N', badgeColor: 'bg-primary/20 text-primary border-primary/40' },
      { href: '/dashboard/logs', label: 'Immutable Audit Logs', icon: History },
      { href: '/dashboard/contracts', label: 'Smart Contracts', icon: FileCode2 },
    ],
  },
  {
    title: 'PUBLIC VERIFICATION',
    items: [
      { href: '/verify', label: 'Asset Verification Portal', icon: CheckCircle2 },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);
  const [blockHeight, setBlockHeight] = React.useState(8942110);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBlockHeight((prev) => prev + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = () => {
    disconnect();
    toast.info('Disconnected from BEL SecureChain');
    router.push('/');
  };

  const formattedAddress = address
    ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
    : '0xf39F...2266';

  const did = address
    ? `did:bel:${address.substring(0, 8)}...`
    : 'did:bel:7f82e4...';

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Wallet address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden cyber-grid">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-primary/20 bg-card/75 backdrop-blur-2xl flex flex-col z-30 shadow-2xl relative">
        {/* Brand Header */}
        <div className="p-5 border-b border-primary/15 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border border-primary/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)] group-hover:scale-105 transition-transform">
              <div className="relative flex items-center justify-center">
                <Radio className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-lg tracking-wider text-foreground">
                  BEL <span className="text-primary text-glow">SECURE</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400">
                  DEFCON 5 • ONLINE
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold font-mono tracking-widest text-muted-foreground/70 uppercase">
                {section.title}
              </div>
              {section.items.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-primary/15 text-primary font-semibold border border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border hover:border-primary/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                        }`}
                      />
                      <span className="text-xs font-medium tracking-wide">{link.label}</span>
                    </div>

                    {link.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          link.badgeColor || 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}

                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_8px_rgba(0,240,255,0.8)]"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* System Telemetry Footer */}
        <div className="p-4 border-t border-primary/15 bg-background/40 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Block: #{blockHeight}</span>
            </div>
            <span className="text-emerald-400 font-bold">14ms latency</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-muted-foreground/60 font-mono">BEL-v2.4-SECURE</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Command Header */}
        <header className="h-16 flex-shrink-0 border-b border-primary/20 bg-card/60 backdrop-blur-xl flex items-center justify-between px-8 z-20 shadow-sm">
          {/* Left: Chain Telemetry Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Sepolia Testnet</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-emerald-400 font-semibold">12 Gwei</span>
            </div>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-accent/20 bg-accent/5 text-accent text-xs font-mono">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Policy Engine</span>
            </div>
          </div>

          {/* Right: User DID, Notifications, Disconnect */}
          <div className="flex items-center gap-3">
            {/* DID & Wallet Pill */}
            <div
              onClick={copyToClipboard}
              className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/25 bg-background/70 hover:border-primary/60 transition-all shadow-sm"
              title="Click to copy wallet address"
            >
              <div className="w-2 h-2 rounded-full bg-primary group-hover:scale-125 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-muted-foreground font-mono leading-none">ACTIVE DID</span>
                <span className="text-xs font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                  {formattedAddress}
                </span>
              </div>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors opacity-60" />
              )}
            </div>

            {/* SOC Alerts Bell */}
            <Link
              href="/soc"
              className="relative p-2.5 rounded-xl border border-primary/20 bg-background/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title="Threat SOC Stream"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-muted-foreground hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
          {children}
        </main>
      </div>
    </div>
  );
}
