'use client';

import { ShieldCheck, Users, Key, AlertCircle } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function RBACPage() {
  const roles = [
    {
      name: "ADMIN",
      users: 2,
      permissions: ["Create Users", "Create Assets", "Assign Permissions", "Transfer Ownership"],
      color: "text-primary border-primary/30 bg-primary/10"
    },
    {
      name: "MANAGER",
      users: 15,
      permissions: ["View Assets", "Approve Requests", "Limited Management"],
      color: "text-accent border-accent/30 bg-accent/10"
    },
    {
      name: "AUDITOR",
      users: 5,
      permissions: ["View Records", "View Audit History"],
      color: "text-purple-400 border-purple-500/30 bg-purple-500/10"
    },
    {
      name: "USER",
      users: 414,
      permissions: ["View Own Assets", "Request Access"],
      color: "text-green-400 border-green-500/30 bg-green-500/10"
    }
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          Access Control (RBAC)
        </h1>
        <p className="text-muted-foreground">Smart contract enforced Role-Based Access Control matrix.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {roles.map((role) => (
          <AnimatedCard key={role.name} className="p-5 border border-primary/20 bg-card/60 backdrop-blur-xl flex flex-col">
            <div className={`px-3 py-1.5 rounded-md text-xs font-bold w-fit mb-4 border ${role.color}`}>
              {role.name} ROLE
            </div>
            
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">{role.users}</span>
              <span className="text-xs text-muted-foreground">Assigned</span>
            </div>

            <div className="flex-1">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-3">Permissions</h3>
              <ul className="space-y-2">
                {role.permissions.map((perm, i) => (
                  <li key={i} className="text-sm text-foreground flex items-center gap-2">
                    <Key className="w-3 h-3 text-primary opacity-70" />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedCard>
        ))}
      </div>

      <AnimatedCard className="mt-4 p-6 border border-primary/20 bg-card/60 backdrop-blur-xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
        <div>
          <h2 className="text-lg font-bold text-foreground mb-2">Smart Contract Enforcement</h2>
          <p className="text-sm text-muted-foreground">
            Unlike traditional systems where the frontend hides buttons, these roles are strictly enforced at the blockchain level by <span className="text-primary font-mono bg-primary/10 px-1 rounded">AccessControlManager.sol</span>. Even if an attacker bypasses the frontend, any transaction they send will be mathematically rejected by the smart contract if they lack the cryptographic role.
          </p>
        </div>
      </AnimatedCard>
    </div>
  );
}
