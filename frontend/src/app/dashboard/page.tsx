'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { 
  CheckSquare, 
  User, 
  Network as NetworkIcon, 
  Zap, 
  Activity, 
  Plus, 
  ShieldAlert, 
  Users, 
  CheckCircle2, 
  Radio, 
  FileText, 
  Lock, 
  ArrowRight, 
  ShieldCheck,
  FolderLock
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { MintAssetModal } from '@/components/assets/MintAssetModal';
import { RoleCheckbox } from '@/components/dashboard/RoleCheckbox';

export default function Dashboard() {
  const { address } = useAccount();
  const router = useRouter();
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState({ 
    activeUsers: 14, 
    executionRate: 99.4, 
    networkHealth: 100,
    threatScore: 18,
    totalAssets: 3,
    totalIdentities: 8
  });
  const [latestLogs, setLatestLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const [statsRes, socRes] = await Promise.all([
          fetch('http://localhost:3001/api/dashboard/stats', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          }),
          fetch('http://localhost:3001/api/soc/stats')
        ]);

        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats((prev) => ({
            ...prev,
            ...data.stats
          }));
          setLatestLogs(data.latestLogs || []);
        }

        if (socRes.ok) {
          const socData = await socRes.json();
          setStats((prev) => ({
            ...prev,
            threatScore: socData.stats?.threatScore ?? 18,
            totalIdentities: socData.stats?.totalIdentities ?? 8
          }));
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const did = isMounted && address
    ? `did:bel:${address.substring(0, 6)}...`
    : 'did:bel:7f82...';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      {/* Top Banner & Quick Command Strip */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card border border-muted/80 dark:border-white/10 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              BEL Command <span className="text-primary">Dashboard</span>
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-500">
              NOMINAL
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zero-Trust Decentralized Identity, Defense Asset Tokenization &amp; Anomaly Telemetry
          </p>
        </div>

        {/* Action Shortcuts (Horizontal momentum scrollable on mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none">
          <Link
            href="/soc"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/25 font-bold text-xs hover:bg-red-500 hover:text-white transition-all shrink-0"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>SOC Radar</span>
            <span className="bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded text-[10px]">{stats.threatScore}%</span>
          </Link>
          <Link
            href="/governance"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/25 font-bold text-xs hover:bg-primary hover:text-white transition-all shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quorum Multi-Sig</span>
          </Link>
          <Link
            href="/verify"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 font-bold text-xs hover:bg-emerald-500 hover:text-white transition-all shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify Asset</span>
          </Link>
          <button
            onClick={() => setIsMintModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3.5 py-2 rounded-xl font-bold text-xs transition-all hover:bg-primary/90 shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mint Asset</span>
          </button>
        </div>
      </div>

      {/* Top 4 Stat Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <AnimatedCard className="p-4 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-muted-foreground uppercase">Total Identities (DID)</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-foreground">{stats.totalIdentities}</div>
            <span className="text-[10px] text-emerald-500 font-mono font-semibold">100% Cryptographically Verified</span>
          </div>
        </AnimatedCard>

        {/* Metric 2 */}
        <AnimatedCard className="p-4 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-muted-foreground uppercase">Tokenized Assets</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-foreground">{stats.totalAssets}</div>
            <span className="text-[10px] text-primary font-mono font-semibold">AES-256 IPFS Encrypted</span>
          </div>
        </AnimatedCard>

        {/* Metric 3 */}
        <AnimatedCard className="p-4 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-muted-foreground uppercase">SOC Threat Score</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${stats.threatScore >= 50 ? 'text-red-500' : 'text-primary'}`}>
              {stats.threatScore} / 100
            </div>
            <span className="text-[10px] text-muted-foreground font-mono font-semibold">DEFCON 5 • Security Nominal</span>
          </div>
        </AnimatedCard>

        {/* Metric 4 */}
        <AnimatedCard className="p-4 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-muted-foreground uppercase">Contract Execution</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-500">{stats.executionRate}%</div>
            <span className="text-[10px] text-muted-foreground font-mono font-semibold">EVM Deterministic State</span>
          </div>
        </AnimatedCard>
      </div>

      {/* Main Grid: 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel 1: Node Network Visualizer (Col span 12 on mobile/tablet, 5 on desktop) */}
        <AnimatedCard className="lg:col-span-5 p-4 sm:p-5 flex flex-col relative overflow-hidden border border-muted/80 dark:border-white/10 bg-card shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <NetworkIcon className="w-4 h-4 text-primary" />
              Zero-Trust Node Topology
            </h2>
            <div className="text-[11px] bg-muted px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              EVM Peered
            </div>
          </div>

          {/* Node Graph Display */}
          <div className="flex-1 relative flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
            {/* Center Core Hub */}
            <div className="absolute z-10 flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="text-[8px] sm:text-[9px] mt-1 font-mono text-primary bg-card px-2 py-0.5 rounded-full border border-primary/20 shadow-sm">
                REGISTRY CORE
              </span>
            </div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-30">
              <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50%" y1="50%" x2="15%" y2="50%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3,3" />
            </svg>

            {/* Orbiting Satellite Nodes */}
            {[
              { top: '18%', left: '22%', icon: User, label: 'Commander' },
              { top: '12%', left: '50%', icon: User, label: did },
              { top: '18%', left: '78%', icon: Zap, label: 'AccessControl' },
              { top: '50%', left: '15%', icon: User, label: 'Auditor' },
              { top: '50%', left: '85%', icon: Zap, label: 'AssetNFT' },
              { top: '82%', left: '25%', icon: User, label: 'Radar Officer' },
              { top: '88%', left: '50%', icon: Zap, label: 'AuditLog' },
              { top: '82%', left: '75%', icon: Zap, label: 'QuorumMultiSig' },
            ].map((node, i) => (
              <div key={i} className="absolute flex flex-col items-center" style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center bg-card shadow-sm ${
                  node.icon === Zap ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-primary border-primary/30 bg-primary/10'
                }`}>
                  <node.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <span className="text-[7px] sm:text-[8px] font-mono mt-0.5 text-muted-foreground whitespace-nowrap bg-card px-1 py-0.2 rounded border border-muted">
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Panel 2: Live System Status (Col span 12 on mobile, 6 on tablet, 3 on desktop) */}
        <AnimatedCard className="lg:col-span-3 p-4 sm:p-5 flex flex-col justify-between border border-muted/80 dark:border-white/10 bg-card shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">Live Telemetry</h2>
            <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          </div>

          <div className="flex flex-col gap-4 flex-1 justify-center py-2">
            {/* Metric A */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Active Officers</span>
                  <span className="font-mono font-bold text-foreground">{stats.activeUsers}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-primary"></div>
                </div>
              </div>
            </div>

            {/* Metric B */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">EVM Execution</span>
                  <span className="font-mono font-bold text-foreground">{stats.executionRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${stats.executionRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Metric C */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Network Integrity</span>
                  <span className="font-mono font-bold text-foreground">{stats.networkHealth}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${stats.networkHealth}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Panel 3: RBAC Matrix Preview (Col span 12 on mobile, 6 on tablet, 4 on desktop) */}
        <AnimatedCard className="lg:col-span-4 p-4 sm:p-5 flex flex-col border border-muted/80 dark:border-white/10 bg-card shadow-sm overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground">RBAC Role Matrix</h2>
            <Link href="/dashboard/rbac" className="text-xs text-primary hover:underline font-mono">
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs min-w-[240px]">
              <thead>
                <tr className="text-muted-foreground uppercase font-mono tracking-wider border-b border-muted pb-2">
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium text-center">Create</th>
                  <th className="pb-2 font-medium text-center">Assign</th>
                  <th className="pb-2 font-medium text-center">View</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-muted/40">
                  <td className="py-2 text-primary font-bold font-mono">ADMIN</td>
                  <td className="py-2 text-center"><RoleCheckbox role="ADMIN" action="Create" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="ADMIN" action="Assign" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="ADMIN" action="View" /></td>
                </tr>
                <tr className="border-b border-muted/40">
                  <td className="py-2 text-primary font-bold font-mono">MANAGER</td>
                  <td className="py-2 text-center"><RoleCheckbox role="MANAGER" action="Create" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="MANAGER" action="Assign" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="MANAGER" action="View" /></td>
                </tr>
                <tr className="border-b border-muted/40">
                  <td className="py-2 text-purple-500 font-bold font-mono">AUDITOR</td>
                  <td className="py-2 text-center"><RoleCheckbox role="AUDITOR" action="Create" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="AUDITOR" action="Assign" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="AUDITOR" action="View" /></td>
                </tr>
                <tr>
                  <td className="py-2 text-emerald-500 font-bold font-mono">USER</td>
                  <td className="py-2 text-center"><RoleCheckbox role="USER" action="Create" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="USER" action="Assign" /></td>
                  <td className="py-2 text-center"><RoleCheckbox role="USER" action="View" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      </div>

      {/* Bottom Grid: 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel 4: Tamper-Resistant Audit Logs (Col span 12 on mobile/tablet, 6 on desktop) */}
        <AnimatedCard
          className="lg:col-span-6 p-4 sm:p-5 flex flex-col border border-muted/80 dark:border-white/10 bg-card shadow-sm overflow-hidden cursor-pointer hover:border-primary/40 transition-colors group"
          onClick={() => router.push('/dashboard/logs')}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Immutable Audit Trail
            </h2>
            <span className="text-xs text-primary flex items-center gap-1 font-mono">
              View Stream <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[220px] pr-2 space-y-3 relative before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-muted">
            {latestLogs.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-card shadow-sm"></div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground font-mono truncate max-w-[180px] sm:max-w-none">{log.actionType}</p>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                  Actor: {log.actorWallet || log.id}
                </p>
              </div>
            ))}
            {latestLogs.length === 0 && (
              <div className="text-xs text-muted-foreground font-mono p-4 text-center">
                System online. Listening for on-chain state transitions...
              </div>
            )}
          </div>
        </AnimatedCard>

        {/* Panel 5: Confidential Asset Vault (Col span 12 on mobile/tablet, 6 on desktop) */}
        <AnimatedCard className="lg:col-span-6 p-4 sm:p-5 flex flex-col border border-muted/80 dark:border-white/10 bg-card shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-primary" />
              Confidential Asset Vault
            </h2>
            <Link href="/dashboard/assets" className="text-xs text-primary hover:underline font-mono">
              All Assets &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
            <div
              className="bg-muted/30 dark:bg-white/5 rounded-xl border border-muted p-3.5 flex flex-col relative group cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push('/dashboard/assets')}
            >
              <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                TOP SECRET
              </div>
              <div className="rounded-lg bg-red-500/10 flex items-center justify-center my-2 p-3">
                <FileText className="w-7 h-7 text-red-500 group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-xs font-bold text-foreground truncate">Swathi WLR Blueprints</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Asset #1024 • IPFS</p>
            </div>

            <div
              className="bg-muted/30 dark:bg-white/5 rounded-xl border border-muted p-3.5 flex flex-col relative group cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push('/dashboard/assets')}
            >
              <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                SECRET
              </div>
              <div className="rounded-lg bg-amber-500/10 flex items-center justify-center my-2 p-3">
                <FileText className="w-7 h-7 text-amber-500 group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-xs font-bold text-foreground truncate">Naval Sonar Specs</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Asset #2048 • IPFS</p>
            </div>

            <div
              className="bg-muted/30 dark:bg-white/5 rounded-xl border border-muted p-3.5 sm:flex hidden flex-col relative group cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => router.push('/dashboard/assets')}
            >
              <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                RESTRICTED
              </div>
              <div className="rounded-lg bg-primary/10 flex items-center justify-center my-2 p-3">
                <FileText className="w-7 h-7 text-primary group-hover:scale-105 transition-transform" />
              </div>
              <p className="text-xs font-bold text-foreground truncate">EVM Crypto Keys</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Asset #3096 • IPFS</p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      <MintAssetModal
        isOpen={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
      />
    </div>
  );
}
