'use client';

import { useState, useEffect } from 'react';
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
    totalIdentities: 8,
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
    const interval = setInterval(fetchSocData, 5000);
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
        toast.warning(`[DEFENSE ALERT] Simulated anomaly triggered: ${type}`);
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
          reason: reason || 'Commander Manual Action',
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(shouldQuarantine ? `Wallet ${wallet.substring(0, 8)}... QUARANTINED` : `Quarantine lifted for ${wallet.substring(0, 8)}...`);
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
        toast.success(`Incident #${id} marked as resolved`);
        fetchSocData();
      }
    } catch (err) {
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-muted/60 dark:border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-muted bg-card hover:border-primary/40 text-foreground transition-all shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-extrabold tracking-tight">
                Defense SOC <span className="text-primary">&amp; Threat Radar</span>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time on-chain anomaly detection and automated circuit breaker containment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            href="/governance"
            className="px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/5 text-primary font-mono font-medium text-xs hover:bg-primary/10 transition-all"
          >
            Quorum Multi-Sig &rarr;
          </Link>
          <button
            onClick={fetchSocData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-muted bg-card text-foreground text-xs font-mono font-medium hover:border-primary/40 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <ThemeToggle />
        </div>
      </div>

      {/* Threat Radar & Attack Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Metric Card (Col 12 on mobile/tablet, 4 on desktop) */}
        <AnimatedCard className="lg:col-span-4 p-5 sm:p-6 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between rounded-2xl relative overflow-hidden shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary animate-pulse" />
              Defense Threat Posture
            </h2>
            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
              stats.threatScore >= 75 ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' :
              stats.threatScore >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
              'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
            }`}>
              {stats.threatLevel}
            </span>
          </div>

          {/* Sweeping Radar Graphic */}
          <div className="my-5 flex flex-col items-center justify-center relative">
            <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
              {/* Animated Radar Sweeper */}
              <div className="absolute inset-0 rounded-full border border-primary/20"></div>
              <div className="absolute inset-4 rounded-full border border-primary/15 border-dashed"></div>
              <div className="absolute inset-8 rounded-full border border-primary/10"></div>

              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-primary/15"></div>
              <div className="absolute h-full w-[1px] bg-primary/15"></div>

              {/* Center Score */}
              <div className="text-center z-10 bg-card px-3.5 py-2 rounded-2xl border border-muted shadow-sm">
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  stats.threatScore >= 75 ? 'text-red-500' :
                  stats.threatScore >= 50 ? 'text-amber-500' : 'text-primary'
                }`}>
                  {stats.threatScore}%
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-mono font-bold mt-0.5">
                  Threat Index
                </div>
              </div>
            </div>

            {/* Gauge progress bar */}
            <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden mt-4">
              <div
                className={`h-full transition-all duration-700 ${
                  stats.threatScore >= 75 ? 'bg-red-500' :
                  stats.threatScore >= 50 ? 'bg-amber-500' : 
                  'bg-primary'
                }`}
                style={{ width: `${stats.threatScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-muted/60 dark:border-white/5">
            <div>
              <div className="text-base font-mono font-bold text-foreground">{stats.activeAlertsCount}</div>
              <div className="text-[10px] text-muted-foreground font-mono">Alerts</div>
            </div>
            <div>
              <div className="text-base font-mono font-bold text-red-500">{stats.quarantinedCount}</div>
              <div className="text-[10px] text-muted-foreground font-mono">Locked</div>
            </div>
            <div>
              <div className="text-base font-mono font-bold text-emerald-500">{stats.totalIdentities}</div>
              <div className="text-[10px] text-muted-foreground font-mono">Active DIDs</div>
            </div>
          </div>
        </AnimatedCard>

        {/* Live Attack Simulator & Interactive Range (Col 12 on mobile/tablet, 8 on desktop) */}
        <AnimatedCard className="lg:col-span-8 p-5 sm:p-6 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Live Cyber Range &amp; Attack Simulation
              </h2>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                SANDBOX ACTIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Inject anomalous on-chain attack patterns to showcase automated anomaly detection and defense threat escalation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => handleSimulateAttack('EXFILTRATION')}
                disabled={simulating}
                className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-left transition-all group flex flex-col justify-between gap-2 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <Flame className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-500">CRITICAL</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">Mass Asset Exfiltration</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Simulates rapid bulk downloading of classified radar blueprints.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSimulateAttack('PRIVILEGE_DRIFT')}
                disabled={simulating}
                className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-left transition-all group flex flex-col justify-between gap-2 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-500">HIGH</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">Privilege Drift Probe</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Simulates unauthorized role reassignment probes on unverified nodes.
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSimulateAttack('OFF_HOURS_BURST')}
                disabled={simulating}
                className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-all group flex flex-col justify-between gap-2 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <Activity className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary">MEDIUM</span>
                </div>
                <div>
                  <div className="font-bold text-xs text-foreground">Off-Hours Velocity Burst</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Simulates tactical asset activity outside sanctioned mission schedules.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Commander Circuit Breaker Trigger */}
          <div className="mt-4 pt-3 border-t border-muted/60 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              placeholder="0x... Target Wallet for Immediate Containment"
              value={targetWallet}
              onChange={(e) => setTargetWallet(e.target.value)}
              className="flex-1 bg-muted/30 dark:bg-white/5 border border-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-red-500 w-full"
            />
            <button
              onClick={() => handleToggleQuarantine(targetWallet, true, quarantineReason || 'Commander Emergency Action')}
              disabled={!targetWallet}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shrink-0"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Identity
            </button>
          </div>
        </AnimatedCard>
      </div>

      {/* Incident Stream & Quarantined List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Security Incident Stream (Col 12 on mobile/tablet, 8 on desktop) */}
        <AnimatedCard className="lg:col-span-8 p-5 sm:p-6 bg-card border border-muted/80 dark:border-white/10 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Real-Time Incident Stream ({alerts.length})
            </h2>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-muted-foreground border border-dashed border-muted rounded-xl">
                No active threats detected. System operational in NOMINAL security posture.
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                    alert.status === 'RESOLVED'
                      ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                      : alert.severity === 'CRITICAL'
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <ShieldAlert
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        alert.status === 'RESOLVED' ? 'text-emerald-500' :
                        alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-foreground font-mono">{alert.tactic}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          alert.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Score: {alert.threatScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{alert.description}</p>
                      {alert.targetWallet && (
                        <div className="text-[10px] font-mono text-primary mt-0.5 truncate">
                          Target: {alert.targetWallet}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {alert.targetWallet && alert.status !== 'QUARANTINED' && (
                      <button
                        onClick={() => handleToggleQuarantine(alert.targetWallet, true, alert.tactic)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-mono font-bold transition-all flex items-center gap-1"
                      >
                        <Lock className="w-3 h-3" />
                        Quarantine
                      </button>
                    )}
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-mono font-semibold transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </AnimatedCard>

        {/* Quarantined Identities (Col 12 on mobile/tablet, 4 on desktop) */}
        <AnimatedCard className="lg:col-span-4 p-5 sm:p-6 bg-card border border-muted/80 dark:border-white/10 flex flex-col justify-between rounded-2xl shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-mono font-bold tracking-wider text-red-500 uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500" />
                Quarantined DIDs ({quarantinedIdentities.length})
              </h2>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {quarantinedIdentities.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-muted-foreground border border-dashed border-muted rounded-xl">
                  No identities currently under emergency quarantine.
                </div>
              ) : (
                quarantinedIdentities.map((item) => (
                  <div
                    key={item.walletAddress}
                    className="p-3 rounded-xl border border-red-500/25 bg-red-500/5 flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-red-500 truncate max-w-[160px]">
                        {item.walletAddress}
                      </span>
                      <span className="text-[9px] font-mono bg-red-500 text-white font-bold px-1.5 py-0.2 rounded">
                        LOCKED
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      DID: {item.did}
                    </div>
                    <button
                      onClick={() => handleToggleQuarantine(item.walletAddress, false)}
                      className="mt-1 w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Unlock className="w-3 h-3" />
                      Lift Quarantine
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-muted/60 dark:border-white/5 text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-red-500 shrink-0" />
            Zero-Trust Gateway immediately revokes bearer tokens for locked DIDs.
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}
