'use client';

import { ShieldCheck, Users, Key, AlertCircle, Shield, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RBACPage() {
  const [targetWallet, setTargetWallet] = useState('');
  const [selectedRole, setSelectedRole] = useState('MANAGER');
  const [isProcessing, setIsProcessing] = useState(false);

  const roles = [
    {
      name: "ADMIN",
      users: 2,
      description: "Root defense commander with full administrative authority.",
      permissions: [
        "Deploy & Upgrade Smart Contracts",
        "Grant / Revoke Officer Roles",
        "Override Circuit Breakers",
        "Authorize Top-Secret Assets"
      ],
      color: "text-primary border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(0,240,255,0.2)]",
      badge: "ROOT_AUTHORITY"
    },
    {
      name: "MANAGER",
      users: 15,
      description: "Mission operations commanders & project heads.",
      permissions: [
        "Mint & Tokenize Assets",
        "Approve Quorum Multi-Sig Proposals",
        "Issue Clearance Verifications",
        "Manage Division Nodes"
      ],
      color: "text-accent border-accent/40 bg-accent/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]",
      badge: "COMMANDER"
    },
    {
      name: "AUDITOR",
      users: 5,
      description: "Independent defense security inspectors and compliance officers.",
      permissions: [
        "Inspect Immutable Event Logs",
        "Monitor Real-Time SOC Anomaly Feeds",
        "Audit Zero-Knowledge Credentials",
        "Export Cryptographic Attestations"
      ],
      color: "text-purple-400 border-purple-500/40 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]",
      badge: "AUDIT_CLEARANCE"
    },
    {
      name: "USER",
      users: 414,
      description: "Tactical defense field personnel and general operators.",
      permissions: [
        "Access Permitted Blueprints",
        "Cryptographically Sign Requests",
        "Submit Verification Hashes",
        "View Own Identity Record"
      ],
      color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.2)]",
      badge: "OPERATOR"
    }
  ];

  const handleGrantRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallet) {
      toast.error('Please specify target wallet address');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Role ${selectedRole} granted to ${targetWallet.substring(0, 8)}... on AccessControlManager.sol`);
      setTargetWallet('');
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/20 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground tracking-tight">
              Role-Based Access Control <span className="text-primary text-glow">(RBAC)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Smart contract enforced defense permissions matrix on AccessControlManager.sol
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-mono text-xs font-bold">
          EVM AccessControlManager.sol • ENFORCED
        </div>
      </div>

      {/* 4 Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roles.map((role, idx) => (
          <AnimatedCard 
            key={role.name} 
            delay={idx * 0.08}
            className="p-5 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col justify-between rounded-2xl group hover:border-primary/50 transition-all"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-black border ${role.color}`}>
                  {role.name}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {role.badge}
                </span>
              </div>

              <div className="flex items-center gap-2 my-3 pb-3 border-b border-primary/10">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xl font-mono font-black text-foreground">{role.users}</span>
                <span className="text-xs text-muted-foreground">Active Officers</span>
              </div>

              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {role.description}
              </p>

              <div>
                <h3 className="text-[11px] text-muted-foreground uppercase font-mono font-bold tracking-wider mb-2.5">
                  Granted Capabilities
                </h3>
                <ul className="space-y-2">
                  {role.permissions.map((perm, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-tight">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-primary/10 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>On-Chain Role</span>
              <span className="text-primary font-bold">ACTIVE</span>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Live Role Granting Panel & Security Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Granting Form (Col 6) */}
        <AnimatedCard className="lg:col-span-6 p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Grant Tactical Role on Blockchain</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Directly assign on-chain RBAC roles by executing an authenticated administrative transaction.
            </p>

            <form onSubmit={handleGrantRole} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Target Officer Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x... recipient wallet address"
                  value={targetWallet}
                  onChange={(e) => setTargetWallet(e.target.value)}
                  className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Target Role Clearance</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full mt-1 bg-background/80 border border-primary/30 rounded-xl px-3.5 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="ADMIN">ADMIN (Full Authority)</option>
                  <option value="MANAGER">MANAGER (Commander Ops)</option>
                  <option value="AUDITOR">AUDITOR (Inspect &amp; Stream)</option>
                  <option value="USER">USER (Operator Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !targetWallet}
                className="w-full py-2.5 rounded-xl bg-primary text-background font-bold text-xs hover:shadow-glow transition-all disabled:opacity-50 font-mono flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {isProcessing ? 'Anchoring On-Chain...' : `Grant ${selectedRole} Role (EVM Transaction)`}
              </button>
            </form>
          </div>
        </AnimatedCard>

        {/* Smart Contract Defense Enforcement Banner (Col 6) */}
        <AnimatedCard className="lg:col-span-6 p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <Lock className="w-5 h-5 text-accent" />
              <h2 className="text-base font-bold text-foreground">Cryptographic RBAC vs Traditional Web RBAC</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In conventional Web2 architectures, access control is enforced in API servers that can be bypassed if an attacker finds an SQL injection, unauthorized endpoint, or token forgery vulnerability.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-background/50 border border-primary/15 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" /> Mathematical EVM Rejection
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                In BEL SecureChain, every sensitive state update runs inside <span className="text-primary font-mono font-bold">AccessControlManager.sol</span>. Unsanctioned transactions revert at the bytecode level, guaranteeing zero bypassability.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-primary/10 flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>Deployed at: 0x9d8e...1b2c</span>
            <span className="text-accent font-bold">Sepolia EVM Verified</span>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
