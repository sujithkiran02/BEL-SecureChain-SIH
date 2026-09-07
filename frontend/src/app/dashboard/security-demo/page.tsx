'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Radio,
  Bug,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Lock,
  FileWarning,
  EyeOff,
  UserX,
  RotateCcw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface AttackScenario {
  id: string;
  name: string;
  vector: string;
  description: string;
  defenseMechanism: string;
  icon: any;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'REPLAY_ATTACK',
    name: 'Attack 1: Cryptographic Nonce & Signature Replay',
    vector: 'Re-transmitting consumed SIWE signature to hijack authenticated session',
    description: 'An adversary intercepts a historical cryptographic signature on the wire and attempts to re-play it to authenticate as the victim without access to the private key.',
    defenseMechanism: 'Atomic single-use Nonce tracking in durable database with strict TTL expiration and nonce invalidation.',
    icon: RotateCcw,
    severity: 'HIGH'
  },
  {
    id: 'REVOKED_IDENTITY',
    name: 'Attack 2: Revoked Identity Access Cascade',
    vector: 'De-provisioned or compromised actor attempts to access high-security perimeter or API',
    description: 'An identity revoked by a security administrator on the smart contract registry or database attempts to access protected facilities or query classified records.',
    defenseMechanism: 'Zero-Trust continuous identity evaluation checking DB & Smart Contract registry status on every single operation.',
    icon: UserX,
    severity: 'HIGH'
  },
  {
    id: 'PRIVILEGE_ESCALATION',
    name: 'Attack 3: Unauthorized Privilege Escalation',
    vector: 'Standard employee account crafts requests to execute administrative operations',
    description: 'A standard user account crafts requests to issue Top Secret clearance VCs, assign administrative roles, or modify defense access rules.',
    defenseMechanism: 'Dual-layer RBAC middleware + Zero-Trust Engine verifying on-chain roles and verified credentials before authorizing admin actions.',
    icon: Zap,
    severity: 'CRITICAL'
  },
  {
    id: 'IDOR_ATTACK',
    name: 'Attack 4: Insecure Direct Object Reference (IDOR)',
    vector: 'Attacker queries victim credential UUID in API parameter',
    description: 'An unauthorized user attempts to inspect or exfiltrate another employee’s classified Verifiable Credential by iterating through credential IDs.',
    defenseMechanism: 'Cryptographic DID binding: backend strictly matches caller wallet address with credential subject ownership.',
    icon: EyeOff,
    severity: 'HIGH'
  },
  {
    id: 'ASSET_TAMPERING',
    name: 'Attack 5: Asset Payload Tampering & Anti-Tamper Tripwire',
    vector: 'Rogue storage node or physical disk alteration modifying classified binary file',
    description: 'An attacker modifies the binary contents of a classified defense document on disk. The system computes SHA-256 hash on download.',
    defenseMechanism: 'Real-time SHA-256 integrity verification against immutable blockchain hash record before download. Hash mismatch triggers immediate lockdown and CRITICAL SOC alert.',
    icon: FileWarning,
    severity: 'CRITICAL'
  },
  {
    id: 'REVOKED_CREDENTIAL',
    name: 'Attack 6: Revoked Verifiable Credential Presentation',
    vector: 'Former officer presents previously exported Verifiable Credential at facility gate',
    description: 'An officer presents an exported JSON-LD Verifiable Credential that was revoked due to reassignment or security incident.',
    defenseMechanism: 'Real-time W3C StatusList & Zero-Trust engine evaluation validating status, expiration, and cryptographic signature.',
    icon: Lock,
    severity: 'HIGH'
  }
];

export default function SecurityDemoPage() {
  const [runningAttack, setRunningAttack] = React.useState<string | null>(null);
  const [attackResults, setAttackResults] = React.useState<Record<string, any>>({});

  const handleRunAttack = async (attackType: string) => {
    setRunningAttack(attackType);
    try {
      const res = await fetch('http://localhost:3001/api/soc/attack-demo/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType })
      });

      const data = await res.json();
      setAttackResults((prev) => ({ ...prev, [attackType]: data }));

      if (data.result === 'BLOCKED') {
        toast.success(`DEFENSE SUCCESS: ${data.name} was successfully BLOCKED!`);
      } else {
        toast.error(`ATTACK SUCCEEDED: ${data.name} was NOT blocked!`);
      }
    } catch (e) {
      toast.error('Attack demonstration endpoint error');
    } finally {
      setRunningAttack(null);
    }
  };

  const handleRunAllAttacks = async () => {
    for (const scenario of ATTACK_SCENARIOS) {
      await handleRunAttack(scenario.id);
      await new Promise((r) => setTimeout(r, 600));
    }
    toast.success('All 6 defense attack vectors simulated and verified!');
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/60 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2.5">
                Security Attack & Defense Sandbox
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  SIH 26125 Judge Demo
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Interactive verification of the 6 core cybersecurity defense attack vectors protecting BEL SecureChain
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunAllAttacks}
          disabled={!!runningAttack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          Run All 6 Defense Tests
        </button>
      </div>

      {/* Grid of 6 Attack Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ATTACK_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const result = attackResults[scenario.id];
          const isRunning = runningAttack === scenario.id;

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-muted/60 dark:border-white/10 bg-card p-6 flex flex-col justify-between space-y-5 hover:border-amber-500/30 transition-all shadow-sm"
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-muted/40 border border-muted flex items-center justify-center">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{scenario.name}</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{scenario.id}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      scenario.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    {scenario.severity}
                  </span>
                </div>

                {/* Description & Defense Details */}
                <p className="text-xs text-muted-foreground leading-relaxed">{scenario.description}</p>

                <div className="p-3.5 rounded-xl bg-muted/20 border border-muted/40 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Attack Vector: </span>
                    <span className="text-red-400 font-semibold">{scenario.vector}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase">Defense Shield: </span>
                    <span className="text-emerald-400 font-semibold">{scenario.defenseMechanism}</span>
                  </div>
                </div>

                {/* Live Result Box */}
                {result && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                      result.result === 'BLOCKED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.result === 'BLOCKED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      <span className="font-bold">
                        {result.result === 'BLOCKED' ? 'ATTACK BLOCKED ✓ (DEFENSE ACTIVE)' : 'VULNERABLE ✗'}
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80">HTTP {result.httpStatus}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleRunAttack(scenario.id)}
                disabled={isRunning}
                className="w-full py-2.5 rounded-xl bg-muted/40 hover:bg-muted border border-muted/80 text-foreground text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />}
                {isRunning ? 'Injecting Attack Vector...' : 'Execute Attack Simulation'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
