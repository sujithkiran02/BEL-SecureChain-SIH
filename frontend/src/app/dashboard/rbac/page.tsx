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
      color: "text-primary border-primary/30 bg-primary/10",
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
      color: "text-primary border-primary/30 bg-primary/10",
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
      color: "text-purple-500 border-purple-500/30 bg-purple-500/10",
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
      color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1500px] mx-auto w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold text-foreground tracking-tight">
              Role-Based Access Control <span className="text-primary">(RBAC)</span>
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Smart contract enforced defense permissions matrix on AccessControlManager.sol
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-lg border border-primary/25 bg-primary/10 text-primary font-mono text-xs font-semibold">
          AccessControlManager.sol • ENFORCED
        </div>
      </div>

      {/* 4 Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {roles.map((role, idx) => (
          <AnimatedCard 
            key={role.name} 
            delay={idx * 0.05}
            className="p-5 border border-muted/80 dark:border-white/10 bg-card flex flex-col justify-between rounded-2xl group hover:border-primary/40 transition-all shadow-sm"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${role.color}`}>
                  {role.name}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {role.badge}
                </span>
              </div>

              <div className="flex items-center gap-2 my-2 pb-2 border-b border-muted/60 dark:border-white/5">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-lg font-mono font-black text-foreground">{role.users}</span>
                <span className="text-xs text-muted-foreground">Active Officers</span>
              </div>

              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                {role.description}
              </p>

              <div>
                <h3 className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-wider mb-2">
                  Granted Capabilities
                </h3>
                <ul className="space-y-1.5">
                  {role.permissions.map((perm, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-tight">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-muted/60 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
              <span>On-Chain Status</span>
              <span className="text-primary font-semibold">ACTIVE</span>
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Role Granting & Explainer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Role Granting Form */}
        <AnimatedCard className="lg:col-span-6 p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Grant Tactical Role on Blockchain</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Directly assign on-chain RBAC roles by executing an authenticated administrative transaction.
            </p>

            <form onSubmit={handleGrantRole} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Target Officer Wallet</label>
                <input
                  type="text"
                  required
                  placeholder="0x... recipient wallet address"
                  value={targetWallet}
                  onChange={(e) => setTargetWallet(e.target.value)}
                  className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase">Target Role Clearance</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full mt-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
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
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all disabled:opacity-50 font-mono flex items-center justify-center gap-2 shadow-sm"
              >
                <Shield className="w-4 h-4" />
                {isProcessing ? 'Anchoring On-Chain...' : `Grant ${selectedRole} Role (EVM Tx)`}
              </button>
            </form>
          </div>
        </AnimatedCard>

        {/* Security Explainer */}
        <AnimatedCard className="lg:col-span-6 p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Cryptographic RBAC vs Traditional Web RBAC</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In conventional Web2 architectures, access control is enforced in API servers that can be bypassed if an attacker finds an SQL injection, endpoint vulnerability, or token forgery flaw.
            </p>

            <div className="mt-3 p-3.5 rounded-xl bg-muted/30 dark:bg-white/5 border border-muted space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-emerald-500 font-bold font-mono">
                <CheckCircle2 className="w-4 h-4" /> Mathematical Bytecode Enforcement
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                In BEL SecureChain, every sensitive state update runs inside <span className="text-primary font-mono font-bold">AccessControlManager.sol</span>. Unsanctioned transactions revert at the EVM level.
              </p>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Zero-Trust Multi-Factor Permission Matrix Table */}
      <AnimatedCard className="p-4 sm:p-6 border border-muted/80 dark:border-white/10 bg-card space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-muted/60 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-bold text-foreground font-heading">Zero-Trust Multi-Factor Policy Matrix</h2>
              <p className="text-xs text-muted-foreground">Dynamic evaluation across Role, Resource, Facility, Clearance, and Biometric Factors</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
            DENY-BY-DEFAULT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-muted/60 text-muted-foreground">
                <th className="pb-3">ROLE</th>
                <th className="pb-3">RESOURCE</th>
                <th className="pb-3">ACTION</th>
                <th className="pb-3">FACILITY</th>
                <th className="pb-3">REQ. CLEARANCE</th>
                <th className="pb-3">BIOMETRIC</th>
                <th className="pb-3 text-right">EVALUATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/40">
              <tr className="hover:bg-muted/20">
                <td className="py-3 font-bold text-primary">ADMIN</td>
                <td className="py-3 text-foreground">Smart Contracts</td>
                <td className="py-3 text-muted-foreground">UPGRADE / REVOKE</td>
                <td className="py-3 text-muted-foreground">FACILITY-A</td>
                <td className="py-3 text-amber-400 font-bold">Level 5</td>
                <td className="py-3 text-red-400 font-bold">MANDATORY</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ALLOW</span></td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3 font-bold text-primary">MANAGER</td>
                <td className="py-3 text-foreground">Classified Radar Specs</td>
                <td className="py-3 text-muted-foreground">DOWNLOAD</td>
                <td className="py-3 text-muted-foreground">FACILITY-B</td>
                <td className="py-3 text-amber-400 font-bold">Level 4</td>
                <td className="py-3 text-red-400 font-bold">MANDATORY</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ALLOW</span></td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3 font-bold text-purple-400">AUDITOR</td>
                <td className="py-3 text-foreground">Immutable Blockchain Logs</td>
                <td className="py-3 text-muted-foreground">INSPECT</td>
                <td className="py-3 text-muted-foreground">ALL</td>
                <td className="py-3 text-amber-400 font-bold">Level 3</td>
                <td className="py-3 text-muted-foreground">OPTIONAL</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ALLOW</span></td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3 font-bold text-emerald-400">USER</td>
                <td className="py-3 text-foreground">Avionics Blueprint</td>
                <td className="py-3 text-muted-foreground">VIEW</td>
                <td className="py-3 text-muted-foreground">FACILITY-C</td>
                <td className="py-3 text-amber-400 font-bold">Level 2</td>
                <td className="py-3 text-muted-foreground">OPTIONAL</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">ALLOW</span></td>
              </tr>
              <tr className="hover:bg-muted/20">
                <td className="py-3 font-bold text-emerald-400">USER</td>
                <td className="py-3 text-foreground">Top-Secret Radar Data</td>
                <td className="py-3 text-muted-foreground">DOWNLOAD</td>
                <td className="py-3 text-muted-foreground">FACILITY-B</td>
                <td className="py-3 text-red-400 font-bold">Level 4 (Has: 1)</td>
                <td className="py-3 text-red-400 font-bold">MANDATORY</td>
                <td className="py-3 text-right"><span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">DENY (INSUFFICIENT_CLEARANCE)</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </AnimatedCard>
    </div>
  );
}
