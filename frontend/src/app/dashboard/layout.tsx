'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
  Cpu,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [blockHeight, setBlockHeight] = React.useState(8942110);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  const copyToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Wallet address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-muted/60 dark:border-white/5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-base tracking-wider text-foreground">
                BEL <span className="text-primary">SECURE</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-500">
                DEFCON 5 • ONLINE
              </span>
            </div>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
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
                      ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                      : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
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
      <div className="p-4 border-t border-muted/60 dark:border-white/5 bg-background/50 backdrop-blur-md flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Block: #{blockHeight}</span>
          </div>
          <span className="text-emerald-500 font-bold">14ms</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground/60 font-mono">BEL-v2.4-SECURE</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar (visible on lg+) */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 border-r border-muted/60 dark:border-white/5 bg-card flex-col z-30 shadow-sm relative">
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer (visible on < lg) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-card border-r border-muted/60 dark:border-white/5 z-50 lg:hidden flex flex-col shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Top Command Header */}
        <header className="h-16 flex-shrink-0 border-b border-muted/60 dark:border-white/5 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 z-20 shadow-sm">
          {/* Left: Hamburger button (on mobile) & Network Telemetry */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-muted hover:bg-muted/40 text-foreground transition-colors"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-muted bg-card text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline text-foreground font-medium">Sepolia Testnet</span>
              <span className="hidden sm:inline text-muted-foreground">|</span>
              <span className="text-emerald-500 font-semibold">12 Gwei</span>
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-muted bg-card text-accent text-xs font-mono">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Policy Engine</span>
            </div>
          </div>

          {/* Right: User DID, Notifications, Disconnect */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* DID & Wallet Pill */}
            <div
              onClick={copyToClipboard}
              className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-muted hover:border-primary/40 bg-card transition-all shadow-sm"
              title="Click to copy wallet address"
            >
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="flex flex-col text-left">
                <span className="hidden sm:inline text-[9px] text-muted-foreground font-mono leading-none">ACTIVE DID</span>
                <span className="text-xs font-mono font-medium text-foreground group-hover:text-primary transition-colors">
                  {formattedAddress}
                </span>
              </div>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors opacity-60" />
              )}
            </div>

            {/* SOC Alerts Bell */}
            <Link
              href="/soc"
              className="relative p-2.5 rounded-xl border border-muted hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
              title="Threat SOC Stream"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* Disconnect Button */}
            <button
              onClick={handleDisconnect}
              className="p-2.5 rounded-xl border border-muted hover:border-red-500/40 text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
