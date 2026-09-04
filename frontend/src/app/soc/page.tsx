'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  ShieldAlert, 
  Radio, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Activity, 
  Flame, 
  RefreshCw, 
  Zap, 
  Terminal,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export default function SocPage() {
  const { address } = useAccount();
  const [stats, setStats] = useState<any>({
    threatScore: 18,
    threatLevel: 'NOMINAL (DEFCON 5)',
    totalIdentities: 0,
    quarantinedCount: 0,
    revokedCount: 0,
    activeAlertsCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [quarantinedIdentities, setQuarantinedIdentities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [targetWallet, setTargetWallet] = useState('');
  const [quarantineReason, setQuarantineReason] = useState('');

  const fetchSocData = async () => {
    try {
      setLoading(true);
      const [statsRes, alertsRes, quarRes] = await Promise.all([
        fetch('http://localhost:3001/api/soc/stats'),
        fetch('http://localhost:3001/api/soc/alerts'),
        fetch('http://localhost:3001/api/soc/quarantined'),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
      }
      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.alerts || []);
      }
      if (quarRes.ok) {
        const qData = await quarRes.json();
        setQuarantinedIdentities(qData.quarantined || []);
      }
    } catch (err) {
      console.error('Failed to fetch SOC data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocData();
    const interval = setInterval(fetchSocData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAttack = async (type: 'EXFILTRATION' | 'PRIVILEGE_DRIFT' | 'OFF_HOURS_BURST') => {
    try {
      setSimulating(true);
      const res = await fetch('http://localhost:3001/api/soc/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackType: type,
          actorWallet: address || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
        }),
      });

      if (res.ok) {
        toast.warning(`[SOC ALERT] Simulated anomaly triggered: ${type}`);
        fetchSocData();
      } else {
        toast.error('Failed to trigger simulation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  const handleToggleQuarantine = async (wallet: string, shouldQuarantine: boolean, reason?: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/soc/quarantine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet,
          shouldQuarantine,
          reason: reason || 'Manual Commander Command',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(shouldQuarantine ? `Wallet ${wallet} QUARANTINED` : `Quarantine lifted for ${wallet}`);
        setTargetWallet('');
        setQuarantineReason('');
        fetchSocData();
      } else {
        toast.error(data.error || 'Failed to toggle quarantine');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error executing quarantine action');
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/soc/alerts/${id}/resolve`, {
        method: 'POST',
      });
      if (res.ok) {
        toast.success(`Alert #${id} marked as resolved`);
        fetchSocData();
      }
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-6 md:p-10 max-w-[1700px] mx-auto w-full gap-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/20 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-background transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                BEL Defense SOC <span className="text-primary">&amp; Threat Intelligence</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time on-chain anomaly detection, MITRE ATT&amp;CK heuristics, and automated circuit breaker containment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/governance"
            className="px-4 py-2 rounded-lg border border-accent/40 bg-accent/10 text-accent font-semibold text-sm hover:bg-accent hover:text-background transition-all"
          >
            Quorum Governance Hub &rarr;
          </Link>
          <button
            onClick={fetchSocData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Threat Radar & Threat Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Metric Card */}
        <AnimatedCard className="lg:col-span-4 p-6 bg-card/50 backdrop-blur-xl border border-primary/20 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary animate-pulse" />
              Defense Threat Posture
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
              stats.threatScore >= 75 ? 'bg-red-500/20 text-red-400 border-red-500/50' :
              stats.threatScore >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' :
              'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
            }`}>
              {stats.threatLevel}
            </span>
          </div>

          {/* Big Score Gauge */}
          <div className="my-6 flex flex-col items-center justify-center relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Animated Radar Circle */}
              <div className="absolute inset-0 rounded-full border border-primary/30 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full border border-primary/20 border-dashed"></div>
              <div className="absolute inset-8 rounded-full border border-primary/10"></div>
              
              <div className="text-center z-10">
                <div className={`text-5xl font-black tracking-tighter ${
                  stats.threatScore >= 75 ? 'text-red-500' :
                  stats.threatScore >= 50 ? 'text-amber-500' : 'text-primary'
                }`}>
                  {stats.threatScore}%
                </div>
                <div className="text-[11px] text-muted-foreground uppercase font-semibold mt-1">
                  Threat Index
                </div>
              </div>
            </div>

            {/* Gauge bar */}
            <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden mt-4">
              <div
                className={`h-full transition-all duration-700 ${
                  stats.threatScore >= 75 ? 'bg-red-500' :
                  stats.threatScore >= 50 ? 'bg-amber-500' : 'bg-primary'
                }`}
                style={{ width: `${stats.threatScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-primary/10">
            <div>
              <div className="text-lg font-bold text-foreground">{stats.activeAlertsCount}</div>
              <div className="text-[10px] text-muted-foreground">Active Alerts</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">{stats.quarantinedCount}</div>
              <div className="text-[10px] text-muted-foreground">Quarantined</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400">{stats.totalIdentities}</div>
              <div className="text-[10px] text-muted-foreground">Active Nodes</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Live Attack Simulator & Interactive Tester (for Judges!) */}
        <AnimatedCard className="lg:col-span-8 p-6 bg-card/50 backdrop-blur-xl border border-primary/20 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Live Cyber Range &amp; Attack Simulation (SIH Interactive Demo)
              </h2>
              <span className="text-[11px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                SANDBOX MODE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Inject anomalous on-chain attack patterns to showcase automated anomaly detection and instant defense threat escalation:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <button
                onClick={() => handleSimulateAttack('EXFILTRATION')}
                disabled={simulating}
                className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left transition-all group flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center">
                  <Flame className="w-6 h-6 text-red-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">CRITICAL</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Mass Asset Exfiltration</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Simulates rapid bulk downloading of classified radar blueprints in under 10s.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSimulateAttack('PRIVILEGE_DRIFT')}
                disabled={simulating}
                className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all group flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center">
                  <AlertTriangle className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">HIGH</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Privilege Escalation Probe</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Simulates unauthorized role reassignment probes on unverified nodes.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSimulateAttack('OFF_HOURS_BURST')}
                disabled={simulating}
                className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-left transition-all group flex flex-col justify-between gap-3"
              >
                <div className="flex justify-between items-center">
                  <Activity className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">MEDIUM</span>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">Off-Hours Velocity Burst</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Simulates tactical asset activity outside of sanctioned mission schedules.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Quick Commander Circuit Breaker Trigger */}
          <div className="mt-6 pt-5 border-t border-primary/10 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              placeholder="0x... Target Wallet Address for Immediate Quarantine"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              className="flex-1 bg-background/80 border border-primary/30 rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-red-500 w-full"
            />
            <button
              onClick={() => handleToggleQuarantine(targetWallet, true, quarantineReason || 'Commander Emergency Action')}
              disabled={!targetWallet}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
            >
              <Lock className="w-4 h-4" />
              Lock Identity (DEFCON Circuit Breaker)
            </button>
          </div>
        </AnimatedCard>
      </div>

      {/* Active Incidents Feed & Quarantined List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Security Incident Stream (Col 8) */}
        <AnimatedCard className="lg:col-span-8 p-6 bg-card/50 backdrop-blur-xl border border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Real-Time Defense Incident Stream ({alerts.length})
            </h2>
          </div>

          <div className="flex flex-col gap-3 max-h-[460px] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-primary/20 rounded-xl">
                No active threats detected. System operational in NOMINAL security posture.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                    alert.status === 'RESOLVED'
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'border-red-500/40 bg-red-500/10'
                      : 'border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert
                      className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                        alert.status === 'RESOLVED' ? 'text-emerald-400' :
                        alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground">{alert.tactic}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Threat Score: {alert.threatScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{alert.description}</p>
                      {alert.targetWallet && (
                        <div className="text-[10px] font-mono text-primary/80 mt-1">
                          Target: {alert.targetWallet}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {alert.targetWallet && alert.status !== 'QUARANTINED' && (
                      <button
                        onClick={() => handleToggleQuarantine(alert.targetWallet, true, alert.tactic)}
                        className="px-3 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-bold transition-all flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Quarantine
                      </button>
                    )}
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </AnimatedCard>

        {/* Quarantined Identities (Col 4) */}
        <AnimatedCard className="lg:col-span-4 p-6 bg-card/50 backdrop-blur-xl border border-red-500/20 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold tracking-wider text-red-400 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                Quarantined Identitites ({quarantinedIdentities.length})
              </h2>
            </div>

            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
              {quarantinedIdentities.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-red-500/20 rounded-xl">
                  No identities currently under emergency quarantine.
                </div>
              ) : (
                quarantinedIdentities.map((item) => (
                  <div
                    key={item.walletAddress}
                    className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-red-300">
                        {item.walletAddress.substring(0, 8)}...{item.walletAddress.substring(item.walletAddress.length - 6)}
                      </span>
                      <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded">
                        LOCKED
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground truncate">
                      DID: {item.did}
                    </div>
                    <button
                      onClick={() => handleToggleQuarantine(item.walletAddress, false)}
                      className="mt-1 w-full py-1.5 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Lift Quarantine
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-500/20 text-[11px] text-muted-foreground flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            Quarantined accounts are automatically blocked by the API Zero-Trust Gateway.
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
