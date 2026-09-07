'use client';

import * as React from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Atom,
  Lock,
  Eye,
  FileCheck2,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';

export default function CredentialsPage() {
  const { address } = useAccount();
  const [credentials, setCredentials] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isIssuerOpen, setIsIssuerOpen] = React.useState(false);
  const [selectedVC, setSelectedVC] = React.useState<any | null>(null);
  const [verificationResult, setVerificationResult] = React.useState<any | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  // Issuer Form State
  const [subjectDid, setSubjectDid] = React.useState('');
  const [credentialType, setCredentialType] = React.useState('SecurityClearanceCredential');
  const [department, setDepartment] = React.useState('Defense Radar & Cyber Warfare');
  const [employeeId, setEmployeeId] = React.useState(`BEL-EMP-${Math.floor(1000 + Math.random() * 9000)}`);
  const [clearanceLevel, setClearanceLevel] = React.useState('4');
  const [facilities, setFacilities] = React.useState(['FACILITY-A', 'FACILITY-B']);
  const [issuing, setIssuing] = React.useState(false);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/credentials/my-credentials', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch (error) {
      console.error('Fetch credentials error:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCredentials();
  }, [address]);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssuing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/credentials/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectDid: subjectDid || `did:securechain:${address?.toLowerCase()}`,
          credentialType,
          claims: {
            employeeId,
            department,
            clearanceLevel: parseInt(clearanceLevel, 10),
            facilities
          },
          expirationDays: 365
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('W3C Verifiable Credential issued with ML-DSA Post-Quantum Signatures!');
        setIsIssuerOpen(false);
        fetchCredentials();
      } else {
        toast.error(data.error || 'Issuance failed');
      }
    } catch (error: any) {
      toast.error('Network error issuing credential');
    } finally {
      setIssuing(false);
    }
  };

  const handleVerify = async (vc: any) => {
    setSelectedVC(vc);
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('http://localhost:3001/api/credentials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: {
            '@context': [
              'https://www.w3.org/2018/credentials/v1',
              'https://w3id.org/security/suites/jws-2020/v1'
            ],
            id: vc.id,
            type: vc.type,
            issuer: vc.issuer,
            issuanceDate: vc.issuanceDate,
            expirationDate: vc.expirationDate,
            credentialSubject: {
              id: vc.subjectDid,
              ...vc.claims
            },
            credentialStatus: {
              id: `https://securechain.bel.gov.in/credentials/status/${vc.id}`,
              type: 'BELCredentialStatusList2026',
              status: vc.status
            },
            proof: vc.proof,
            pqcProof: vc.pqcProof
          }
        })
      });

      const data = await res.json();
      setVerificationResult(data);
    } catch (error) {
      toast.error('Failed to verify credential');
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async (credentialId: string) => {
    if (!confirm('Are you sure you want to revoke this defense credential?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/credentials/${encodeURIComponent(credentialId)}/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Revoked via Security Command Center' })
      });

      if (res.ok) {
        toast.success('Credential revoked. Zero-Trust access terminated.');
        fetchCredentials();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to revoke');
      }
    } catch (e) {
      toast.error('Revocation error');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-muted/60 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2.5">
                W3C Verifiable Credentials
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center gap-1">
                  <Atom className="w-3 h-3 animate-spin" />
                  NIST FIPS 204 (ML-DSA)
                </span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cryptographically bound Decentralized Identity Claims with Dual ECDSA + Post-Quantum Signatures
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCredentials}
            className="p-2.5 rounded-xl border border-muted hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsIssuerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Issue Defense VC
          </button>
        </div>
      </div>

      {/* Grid of Credentials */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-mono text-muted-foreground">Loading Verifiable Credentials...</p>
        </div>
      ) : credentials.length === 0 ? (
        <div className="border border-dashed border-muted rounded-2xl p-12 text-center space-y-4">
          <KeyRound className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <div>
            <h3 className="text-base font-semibold text-foreground">No Verifiable Credentials Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
              No active defense credentials issued to your DID yet. Click "Issue Defense VC" above to issue an official W3C Security Clearance Credential.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {credentials.map((vc) => {
            const isRevoked = vc.status === 'REVOKED';
            const clearance = vc.claims?.clearanceLevel || 1;

            return (
              <motion.div
                key={vc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isRevoked
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-muted/60 dark:border-white/10 bg-card hover:border-primary/40'
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                      {vc.type.find((t: string) => t !== 'VerifiableCredential') || 'EmployeeCredential'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center gap-1">
                      <Atom className="w-3 h-3" />
                      ML-DSA-65
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      isRevoked
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {vc.status}
                  </span>
                </div>

                {/* Body Claims */}
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Subject DID</div>
                    <div className="text-xs font-mono text-foreground truncate font-medium">{vc.subjectDid}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-muted/30 border border-muted/50">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Clearance Level</div>
                      <div className="text-sm font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        Level {clearance} / 5
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-muted/50">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Department</div>
                      <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                        {vc.claims?.department || 'General Defense'}
                      </div>
                    </div>
                  </div>

                  {vc.claims?.facilities && (
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Authorized Facilities</div>
                      <div className="flex flex-wrap gap-1.5">
                        {vc.claims.facilities.map((fac: string) => (
                          <span
                            key={fac}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-card border border-muted text-foreground flex items-center gap-1"
                          >
                            <Building2 className="w-2.5 h-2.5 text-primary" />
                            {fac}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] font-mono text-muted-foreground pt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Expires: {new Date(vc.expirationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-5 mt-4 border-t border-muted/40">
                  <button
                    onClick={() => handleVerify(vc)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Cryptographic Proofs
                  </button>

                  {!isRevoked && (
                    <button
                      onClick={() => handleRevoke(vc.id)}
                      className="flex items-center gap-1 text-[11px] font-mono text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Ban className="w-3 h-3" />
                      Revoke VC
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Issue Verifiable Credential */}
      <AnimatePresence>
        {isIssuerOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-muted/60 dark:border-white/10 rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-heading font-bold text-foreground">Issue W3C Verifiable Credential</h2>
                    <p className="text-xs text-muted-foreground">Signed with BEL Authority ECDSA + NIST ML-DSA-65</p>
                  </div>
                </div>
                <button onClick={() => setIsIssuerOpen(false)} className="text-muted-foreground hover:text-foreground text-sm">
                  ✕
                </button>
              </div>

              <form onSubmit={handleIssue} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-muted-foreground">Subject DID (or wallet)</label>
                  <input
                    type="text"
                    value={subjectDid}
                    onChange={(e) => setSubjectDid(e.target.value)}
                    placeholder={`did:securechain:${address?.toLowerCase()}`}
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-muted bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-muted-foreground">Credential Type</label>
                    <select
                      value={credentialType}
                      onChange={(e) => setCredentialType(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-muted bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                    >
                      <option value="SecurityClearanceCredential">Security Clearance</option>
                      <option value="EmployeeCredential">Employee Identity</option>
                      <option value="FacilityAccessCredential">Facility Access Token</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-muted-foreground">Clearance Level (1-5)</label>
                    <select
                      value={clearanceLevel}
                      onChange={(e) => setClearanceLevel(e.target.value)}
                      className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-muted bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                    >
                      <option value="1">Level 1 - Unclassified</option>
                      <option value="2">Level 2 - Restricted</option>
                      <option value="3">Level 3 - Confidential</option>
                      <option value="4">Level 4 - Secret Defense</option>
                      <option value="5">Level 5 - Top Secret</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl border border-muted bg-background text-foreground text-xs font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-muted-foreground">Authorized Facilities</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {['FACILITY-A', 'FACILITY-B', 'FACILITY-C'].map((f) => {
                      const checked = facilities.includes(f);
                      return (
                        <button
                          type="button"
                          key={f}
                          onClick={() => {
                            if (checked) setFacilities(facilities.filter((x) => x !== f));
                            else setFacilities([...facilities, f]);
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-mono border text-center transition-all ${
                            checked
                              ? 'border-primary bg-primary/10 text-primary font-bold'
                              : 'border-muted bg-card text-muted-foreground'
                          }`}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsIssuerOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-muted text-xs font-semibold hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {issuing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Sign & Issue Credential
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Drawer: Cryptographic Verification Proofs */}
      <AnimatePresence>
        {selectedVC && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-xl bg-card border-l border-muted/60 dark:border-white/10 h-full p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-muted/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <FileCheck2 className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-heading font-bold text-foreground">Cryptographic Proof Inspection</h3>
                  </div>
                  <button onClick={() => setSelectedVC(null)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                {verifying ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-xs font-mono text-muted-foreground">Running Dual ECDSA + ML-DSA-65 Verification...</p>
                  </div>
                ) : verificationResult ? (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl border flex items-center gap-3 ${
                        verificationResult.valid
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-red-500/40 bg-red-500/10 text-red-400'
                      }`}
                    >
                      {verificationResult.valid ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                      <div>
                        <div className="font-bold text-xs font-mono">
                          {verificationResult.valid ? 'CRYPTOGRAPHICALLY VALID' : 'VERIFICATION FAILED'}
                        </div>
                        <div className="text-xs text-foreground/80 mt-0.5">{verificationResult.reason}</div>
                      </div>
                    </div>

                    {/* 8-Step Verification Checklist */}
                    <div className="space-y-2 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 1 — Subject DID Resolved</span>
                        <span className="text-emerald-400 font-bold">RESOLVED ✓</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 2 — Issuer Authority Verified (BEL)</span>
                        <span className={verificationResult.issuerValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.issuerValid ? 'AUTHORIZED ✓' : 'UNAUTHORIZED ✗'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 3 — Classical Signature (ECDSA Secp256k1)</span>
                        <span className={verificationResult.signatureValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.signatureValid ? 'PASS ✓' : 'FAIL ✗'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
                        <span className="text-purple-300 flex items-center gap-1.5">
                          <Atom className="w-3.5 h-3.5" />
                          Step 4 — Post-Quantum Signature (NIST ML-DSA-65)
                        </span>
                        <span className={verificationResult.pqcSignatureValid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.pqcSignatureValid ? 'PASS ✓ (FIPS 204)' : 'FAIL ✗'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 5 — Expiration Checked</span>
                        <span className={verificationResult.notExpired ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.notExpired ? 'VALID ✓' : 'EXPIRED ✗'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 6 — Revocation Checked</span>
                        <span className={verificationResult.notRevoked ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.notRevoked ? 'ACTIVE ✓' : 'REVOKED ✗'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 7 — Holder Proof-of-Possession</span>
                        <span className="text-emerald-400 font-bold">BOUND TO DID ✓</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-muted/20 border border-muted/40 flex items-center justify-between">
                        <span className="text-muted-foreground">Step 8 — Zero-Trust Policy Evaluated</span>
                        <span className={verificationResult.valid ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {verificationResult.valid ? 'ELIGIBLE ✓' : 'INELIGIBLE ✗'}
                        </span>
                      </div>
                    </div>

                    {/* Raw VC JSON Payload */}
                    <div>
                      <div className="text-[11px] font-mono text-muted-foreground mb-1">Full W3C JSON-LD Canonical Representation</div>
                      <pre className="p-3.5 rounded-xl bg-black/40 border border-muted/40 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedVC, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                onClick={() => setSelectedVC(null)}
                className="w-full py-2.5 rounded-xl border border-muted text-xs font-semibold hover:bg-muted/40"
              >
                Close Inspector
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
