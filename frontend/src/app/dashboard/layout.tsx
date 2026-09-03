'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  FolderLock,
  FileCode2,
  History,
  Box,
  Wallet,
  LogOut,
  Bell
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/identity', label: 'Identity (DID)', icon: UserCircle },
  { href: '/dashboard/rbac', label: 'Access Control (RBAC)', icon: ShieldCheck },
  { href: '/dashboard/assets', label: 'Asset Management (NFT)', icon: FolderLock },
  { href: '/dashboard/contracts', label: 'Smart Contracts', icon: FileCode2 },
  { href: '/dashboard/logs', label: 'Audit Logs', icon: History },
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

  const handleDisconnect = () => {
    disconnect();
    router.push('/');
  };

  const did = address
    ? `did:bel:${address.substring(0, 6)}...`
    : 'did:bel:7f82...';

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-primary/20 bg-card/50 backdrop-blur-md flex flex-col z-20">
        <div className="p-6 flex items-center gap-3 border-b border-primary/10">
          <Box className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-wider">BEL SecureChain</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'bg-primary/20 text-primary font-bold shadow-[inset_4px_0_0_0_#00F0FF]'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'opacity-70'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-primary/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Header */}
        <header className="h-20 flex-shrink-0 border-b border-primary/20 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Crypto wallet badge
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="px-4 py-2 rounded-full border border-accent/30 bg-accent/10 text-accent text-sm font-semibold flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-[10px] text-background font-bold">₿</div>
              Crypto wallet
            </button>

            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-muted bg-muted/30">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground">{did}</span>
            </div>

            <button
              onClick={handleDisconnect}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
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
