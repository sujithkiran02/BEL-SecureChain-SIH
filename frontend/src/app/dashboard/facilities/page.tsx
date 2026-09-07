'use client';

import * as React from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Scan,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  Radio,
  MapPin,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function FacilitiesPage() {
  const { address } = useAccount();
  const [facilities, setFacilities] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Biometric state
  const [scanningBio, setScanningBio] = React.useState(false);
  const [bioToken, setBioToken] = React.useState<string | null>(null);
  const [bioExpires, setBioExpires] = React.useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = React.useState<'FACE' | 'FINGERPRINT' | 'IRIS'>('FACE');

  // Evaluation modal
  const [evaluatingFacility, setEvaluatingFacility] = React.useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = React.useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [facRes, logRes] = await Promise.all([
        fetch('http://localhost:3001/api/facilities', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/facilities/logs', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (facRes.ok) {
        const facData = await facRes.json();
        setFacilities(facData.facilities || []);
      }
      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData.logs || []);
      }
    } catch (error) {
      console.error('Facilities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [address]);

  const handleSimulateBiometric = async () => {
    setScanningBio(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/biometric/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          biometricDataHash: '0xmock_bio_hash'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setBioToken(data.sessionToken);
        setBioExpires(data.expiresAt);
        toast.success(`Biometric verification passed (${selectedMethod}). Defense token generated!`);
      } else {
        toast.error(data.error || 'Biometric verification failed');
      }
    } catch (e) {
      toast.error('Biometric scanner service unreachable');
    } finally {
      setTimeout(() => setScanningBio(false), 1200);
    }
  };

  const handleRequestAccess = async (facilityId: string) => {
    setEvaluatingFacility(facilityId);
    setEvaluationResult(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/facilities/${encodeURIComponent(facilityId)}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          biometricToken: bioToken
        })
      });

      const data = await res.json();
      setEvaluationResult(data);
      if (res.ok && data.accessGranted) {
        toast.success(`Access Granted to ${facilityId}! Perimeter gate unlocked.`);
      } else {
        toast.error(`Zero-Trust Denied: ${data.decision?.reason || 'Access rejected'}`);
      }
      fetchData();
    } catch (error) {
      toast.error('Access evaluation error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/60 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2.5">
                Multi-Facility Defense Access & Biometrics
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  ABAC Policy Engine
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Zero-Trust Dynamic Access Verification across High-Security Bharat Electronics Installations
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-muted hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Biometric Multi-Modal Scanner Simulator Bar */}
      <div className="rounded-2xl border border-muted/60 dark:border-white/10 bg-card p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">Defense Biometric Scanner Terminal</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulates physical biometric gate check (Face Recognition + Liveness, IRIS, Fingerprint) generating signed short-lived attestation tokens.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-muted bg-background p-1 gap-1 text-xs font-mono">
              {(['FACE', 'IRIS', 'FINGERPRINT'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMethod(m)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    selectedMethod === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              onClick={handleSimulateBiometric}
              disabled={scanningBio}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {scanningBio ? <Scan className="w-4 h-4 animate-pulse" /> : <Fingerprint className="w-4 h-4" />}
              {scanningBio ? 'Scanning Liveness...' : `Scan ${selectedMethod}`}
            </button>
          </div>
        </div>

        {bioToken && (
          <div className="mt-4 pt-4 border-t border-muted/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biometric Attestation Active (Token: {bioToken.substring(0, 16)}...)</span>
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires: {new Date(bioExpires!).toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {facilities.map((fac) => {
          const isBioReq = fac.biometricRequired;

          return (
            <motion.div
              key={fac.facilityId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-muted/60 dark:border-white/10 bg-card p-6 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    {fac.facilityId}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-muted">
                    {fac.classification}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">{fac.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{fac.location}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                    <span className="text-muted-foreground">Required Clearance</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Level {fac.requiredClearance}+
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                    <span className="text-muted-foreground">Biometric Factor</span>
                    <span className={isBioReq ? 'font-bold text-red-400' : 'text-muted-foreground'}>
                      {isBioReq ? 'MANDATORY' : 'OPTIONAL'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleRequestAccess(fac.facilityId)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Request Zero-Trust Entry
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Access Attempts Log Table */}
      <div className="rounded-2xl border border-muted/60 dark:border-white/10 bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            <h3 className="text-sm font-bold font-heading text-foreground">Live Facility Access Telemetry</h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{logs.length} Total Attempts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-muted/60 text-muted-foreground">
                <th className="pb-3">FACILITY</th>
                <th className="pb-3">SUBJECT DID</th>
                <th className="pb-3">BIOMETRIC</th>
                <th className="pb-3">DECISION</th>
                <th className="pb-3">POLICY REASON</th>
                <th className="pb-3 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/40">
              {logs.map((log) => {
                const isAllow = log.decision === 'ALLOW';
                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-bold text-foreground">{log.facilityId}</td>
                    <td className="py-3 text-muted-foreground">{log.subjectDid ? `${log.subjectDid.substring(0, 18)}...` : 'N/A'}</td>
                    <td className="py-3">
                      {log.biometricVerified ? (
                        <span className="text-emerald-400 font-bold">VERIFIED ✓</span>
                      ) : (
                        <span className="text-muted-foreground">NONE</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          isAllow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {log.decision}
                      </span>
                    </td>
                    <td className="py-3 text-foreground/80 max-w-xs truncate">{log.reason}</td>
                    <td className="py-3 text-right text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-Trust Decision Modal */}
      <AnimatePresence>
        {evaluationResult && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-muted/60 dark:border-white/10 rounded-2xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-muted/60 pb-4">
                <div className="flex items-center gap-3">
                  {evaluationResult.accessGranted ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-heading font-bold text-foreground">
                      {evaluationResult.accessGranted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                    </h2>
                    <p className="text-xs font-mono text-muted-foreground">{evaluatingFacility}</p>
                  </div>
                </div>
                <button onClick={() => setEvaluationResult(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-muted/20 border border-muted/40 text-foreground">
                  <div className="text-[10px] text-muted-foreground uppercase">Reason Code</div>
                  <div className="mt-1 font-semibold">{evaluationResult.decision?.reason}</div>
                </div>

                {evaluationResult.decision?.factors && (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-muted/10 border border-muted/30 flex items-center justify-between">
                      <span className="text-muted-foreground">Identity Registry Status</span>
                      <span className={evaluationResult.decision.factors.identityStatus?.valid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {evaluationResult.decision.factors.identityStatus?.valid ? 'VERIFIED ✓' : 'UNVERIFIED / REVOKED ✗'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/10 border border-muted/30 flex items-center justify-between">
                      <span className="text-muted-foreground">VC Clearance Level</span>
                      <span className="text-foreground font-bold">
                        Level {evaluationResult.decision.factors.credentialEvaluation?.clearanceLevel || 1}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/10 border border-muted/30 flex items-center justify-between">
                      <span className="text-muted-foreground">Biometric Attestation</span>
                      <span className={evaluationResult.decision.factors.biometricEvaluation?.valid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {evaluationResult.decision.factors.biometricEvaluation?.valid ? 'PASS ✓' : 'MISSING / EXPIRED ✗'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setEvaluationResult(null)}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
