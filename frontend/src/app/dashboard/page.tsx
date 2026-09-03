'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckSquare, MoreHorizontal, User, Network as NetworkIcon, Zap, Activity, Plus } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { MintAssetModal } from '@/components/assets/MintAssetModal';
import { useTrustChain } from '@/hooks/useTrustChain';
import { RoleCheckbox } from '@/components/dashboard/RoleCheckbox';

export default function Dashboard() {
  const { address } = useAccount();
  const router = useRouter();
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);

  const did = address
    ? `did:trustchain:${address.substring(0, 6)}...`
    : 'did:trustchain:7f82...';

  const { setPermission } = useTrustChain();

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <button
          onClick={() => setIsMintModalOpen(true)}
          className="flex items-center gap-2 bg-primary/20 text-primary border border-primary/50 px-5 py-2 rounded-lg font-bold transition-all hover:bg-primary hover:text-background hover:shadow-glow hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Mint Asset (Admin)
        </button>
      </div>

      {/* Top Grid: 3 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[400px]">

        {/* Panel 1: Node Network (Col span 4) */}
        <AnimatedCard className="lg:col-span-4 p-5 flex flex-col relative overflow-hidden border border-primary/20 bg-card/60 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              Node Network
            </h2>
            <div className="text-xs bg-muted/50 px-3 py-1 rounded-full flex items-center gap-2 border border-primary/10">
              <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
              Nodes
            </div>
          </div>

          {/* CSS Node Graph Representation */}
          <div className="flex-1 relative flex items-center justify-center mt-4">
            {/* Center Node */}
            <div className="absolute z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center shadow-glow">
                <NetworkIcon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] mt-2 font-mono text-primary bg-background/80 px-2 py-0.5 rounded-full">DID</span>
            </div>

            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full opacity-30">
              <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="15%" y2="50%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="85%" y2="50%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="var(--primary)" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="var(--primary)" strokeWidth="1" />
            </svg>

            {/* Orbiting Nodes */}
            {[
              { top: '15%', left: '20%', icon: User, label: 'Identity' },
              { top: '10%', left: '50%', icon: User, label: did },
              { top: '15%', left: '80%', icon: Zap, label: 'Smart Contract' },
              { top: '50%', left: '15%', icon: User, label: 'Identity' },
              { top: '50%', left: '85%', icon: Zap, label: 'Smart Contract' },
              { top: '80%', left: '25%', icon: User, label: 'Identity' },
              { top: '85%', left: '50%', icon: Zap, label: 'Smart Contract' },
              { top: '80%', left: '75%', icon: Zap, label: 'Smart Contract' },
            ].map((node, i) => (
              <div key={i} className="absolute flex flex-col items-center" style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }}>
                <div className={`w-8 h-8 rounded-full border border-primary/50 flex items-center justify-center bg-card
                  ${node.icon === Zap ? 'text-green-400 border-green-500/50' : 'text-accent border-accent/50'}
                `}>
                  <node.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] mt-1 text-muted-foreground whitespace-nowrap">{node.label}</span>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Panel 2: Live System Status (Col span 3) */}
        <AnimatedCard className="lg:col-span-3 p-5 flex flex-col gap-6 border border-primary/20 bg-card/60 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-muted-foreground">Live System Status</h2>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-6 flex-1 justify-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Active Users</span>
                </div>
                <div className="text-xl font-bold text-foreground">436</div>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="w-[85%] h-full bg-primary shadow-glow"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Contract Execution</span>
                </div>
                <div className="text-xl font-bold text-foreground">29.5%</div>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="w-[29%] h-full bg-accent shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Network Health</span>
                </div>
                <div className="text-xl font-bold text-foreground">100%</div>
                <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                  <div className="w-full h-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>

        {/* Panel 3: Role Assignment Matrix (Col span 5) */}
        <AnimatedCard className="lg:col-span-5 p-5 flex flex-col border border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground">Role Assignment Matrix</h2>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-primary/10">
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium text-center">Create</th>
                  <th className="pb-3 font-medium text-center">Assign</th>
                  <th className="pb-3 font-medium text-center">View</th>
                  <th className="pb-3 font-medium text-center">Req</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                <tr className="border-b border-primary/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 text-muted-foreground font-semibold">ADMIN</td>
                  <td className="py-3 text-center"><RoleCheckbox role="ADMIN" action="Create" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="ADMIN" action="Assign" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="ADMIN" action="View" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="ADMIN" action="Req" /></td>
                </tr>
                <tr className="border-b border-primary/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 text-muted-foreground font-semibold">MANAGER</td>
                  <td className="py-3 text-center"><RoleCheckbox role="MANAGER" action="Create" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="MANAGER" action="Assign" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="MANAGER" action="View" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="MANAGER" action="Req" /></td>
                </tr>
                <tr className="border-b border-primary/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 text-muted-foreground font-semibold">AUDITOR</td>
                  <td className="py-3 text-center"><RoleCheckbox role="AUDITOR" action="Create" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="AUDITOR" action="Assign" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="AUDITOR" action="View" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="AUDITOR" action="Req" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-muted-foreground font-semibold">USER</td>
                  <td className="py-3 text-center"><RoleCheckbox role="USER" action="Create" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="USER" action="Assign" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="USER" action="View" /></td>
                  <td className="py-3 text-center"><RoleCheckbox role="USER" action="Req" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimatedCard>

      </div>

      {/* Bottom Grid: 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[350px]">

        {/* Panel 4: Tamper-Resistant Audit Logs (Col span 6) */}
        <AnimatedCard
          className="lg:col-span-6 p-5 flex flex-col border border-primary/20 bg-card/60 backdrop-blur-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => router.push('/dashboard/logs')}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors">Tamper-resistant Audit Logs</h2>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 relative before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-primary/20">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-background shadow-glow"></div>
                <p className="text-sm font-semibold text-foreground">Action verified</p>
                <p className="text-xs text-muted-foreground font-mono truncate mt-1">hash: d1cb37c7f22caada87ca0e7...</p>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* Panel 5: Digital Asset NFT (Col span 6) */}
        <AnimatedCard className="lg:col-span-6 p-5 flex flex-col border border-primary/20 bg-card/60 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground">Digital Asset Verification</h2>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
            <div
              className="bg-background/50 rounded-xl border border-primary/20 p-4 flex flex-col relative group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push('/dashboard/assets')}
            >
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-glow z-10">
                <CheckSquare className="w-3 h-3 text-background" />
              </div>
              <div className="flex-1 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-accent drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] group-hover:scale-110 transition-transform">
                  <path fill="currentColor" d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.22l7.365 4.354 7.365-4.35L12.056 0z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Asset #1024</p>
              <p className="text-[10px] text-muted-foreground">Verified Authentic</p>
            </div>

            <div
              className="bg-background/50 rounded-xl border border-primary/20 p-4 flex flex-col relative group cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => router.push('/dashboard/assets')}
            >
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-glow z-10">
                <CheckSquare className="w-3 h-3 text-background" />
              </div>
              <div className="flex-1 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-3">
                <div className="text-4xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] group-hover:scale-110 transition-transform">M</div>
              </div>
              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">Asset #2048</p>
              <p className="text-[10px] text-muted-foreground">Verified Authentic</p>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => router.push('/dashboard/assets')}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              View All Assets &gt;
            </button>
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
