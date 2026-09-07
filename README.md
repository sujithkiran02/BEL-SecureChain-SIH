# BEL SecureChain — Defense-Grade SSI, Post-Quantum Verifiable Credentials & Zero-Trust Architecture

**Smart India Hackathon (SIH) Problem Statement 26125**  
*Bharat Electronics Limited (BEL) Defense Identity, Quantum-Resistant Verifiable Credentials & Zero-Trust Security Perimeter*

---

## 1. System Architecture

```text
                         BEL AUTHORITY (PQC Master Key)
                                      |
                             DID + VC ISSUANCE
                       (ECDSA + NIST FIPS 204 ML-DSA)
                                      |
                                      v
                            +-------------------+
                            |   SSI IDENTITY    |
                            |                   |
                            | DID (did:securechain)
                            | Wallet Address    |
                            | W3C Dual-Proof VC |
                            +---------+---------+
                                      |
                            Credential Presentation
                                      |
                                      v
                            +-------------------+
                            | AUTHENTICATION    |
                            |                   |
                            | SIWE Message      |
                            | Durable Nonce     |
                            | Cryptographic Sig |
                            | 15m Token Session |
                            +---------+---------+
                                      |
                                      v
                            +-------------------+
                            | ZERO-TRUST ENGINE |
                            +---------+---------+
                                      |
             +------------------------+------------------------+
             |                        |                        |
             v                        v                        v
      Identity Status               RBAC                 Credential Claims
   (Verified / Revoked)      (ADMIN/MANAGER/USER)      (Clearance 1-5, Facs)
             |                        |                        |
             +------------------------+------------------------+
                                      |
                                      v
                           Defense Facility Policy
                        (FACILITY-A / B / C Check)
                                      |
                                      v
                           Biometric Attestation
                         (Face / Iris / Fingerprint)
                                      |
                                      v
                            +-------------------+
                            | ACCESS DECISION   |
                            |                   |
                            |  ALLOW  /  DENY   |
                            +---------+---------+
                                      |
                       +--------------+--------------+
                       |                             |
                       v                             v
             Classified Asset Vault           Facility Perimeter
                / NFT Ownership                     Entry
                       |                             |
                       v                             v
             SHA-256 Anti-Tamper              Access Decision
                 Verification                      Logged
                       |                             |
                       +--------------+--------------+
                                      |
                                      v
                            +-------------------+
                            | BLOCKCHAIN AUDIT  |
                            |  IMMUTABLE LOG    |
                            +-------------------+
```

---

## 2. Key Defense Features

### 1. Self-Sovereign Identity (SSI) & W3C DID Document
- Standardized DID scheme: `did:securechain:<walletAddress>`.
- Fully resolvable W3C DID documents via `/api/did/resolve/:did` exposing verification methods for Classical Secp256k1 and Post-Quantum ML-DSA keys.
- On-chain identity anchoring via `IdentityRegistry.sol`.

### 2. Post-Quantum Cryptography (PQC) — NIST FIPS 204 (ML-DSA)
- Quantum-resistant cryptographic signature scheme (**ML-DSA-65 / Dilithium**).
- Dual-Proof Hybrid Architecture: Credentials contain both Classical ECDSA Secp256k1 and Post-Quantum ML-DSA-65 signatures.
- Full cryptographic verification with tamper rejection.

### 3. W3C Verifiable Credentials (VC) System
- Standards-compliant JSON-LD credentials (`SecurityClearanceCredential`, `EmployeeCredential`, `FacilityAccessCredential`).
- Complete issuance, holder presentation, cryptographic verification, and revocation cascade.

### 4. Zero-Trust Policy Engine (RBAC + ABAC + Facilities + Biometrics)
- Centralized `ZeroTrustEngine.authorize()` service evaluating all access requests dynamically.
- Evaluates: DID registry status, VC clearance levels (1 to 5), authorized facility whitelist, role claims, and biometric factor tokens.

### 5. Multi-Facility & Multi-Modal Biometric Security
- Multi-facility management (`FACILITY-A` Bangalore HQ, `FACILITY-B` Radar Lab Ghaziabad, `FACILITY-C` Avionics Pune).
- Biometric verification simulator supporting Face Recognition + Liveness, IRIS scanning, and Fingerprint matching generating signed short-lived tokens (15m TTL).

### 6. Anti-Tamper Digital Asset Vault
- SHA-256 content-addressable storage linked to ERC-721 `AssetNFT.sol`.
- Real-time hash verification on download: any file byte alteration triggers instant access termination and CRITICAL SOC threat alert.

### 7. SOC Threat Radar & Quorum Governance
- Live threat telemetry with DEFCON circuit breaker and automated quarantine.
- M-of-N multi-officer consensus for high-clearance actions.

---

## 3. Installation & Local Development

### Prerequisites
- Node.js >= 20.19.0
- Git

### 1. Clone Repository
```bash
git clone https://github.com/sujithkiran02/BEL-SecureChain-SIH.git
cd BEL-SecureChain-SIH
```

### 2. Smart Contracts
```bash
cd contracts
npm install
npx hardhat node
# In another terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. Backend Setup
```bash
cd ../backend
npm install
npx prisma db push
npx prisma generate
npm run dev
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Running Automated Tests

Run the comprehensive defense test suite verifying PQC ML-DSA, W3C VCs, Zero-Trust engine, and all 6 attack vectors:
```bash
cd backend
npm test
```

Expected output:
```text
===============================================================
  BEL SecureChain — SIH Problem Statement 26125 Security Test
===============================================================
--- TEST SUITE 1: Post-Quantum Cryptography (ML-DSA-65) ---
  [PASS] ✓ BEL Authority ML-DSA-65 key initialized
  [PASS] ✓ Authority signs payload with ML-DSA-65
  [PASS] ✓ ML-DSA-65 signature cryptographically verifies
  [PASS] ✓ ML-DSA-65 detects and rejects tampered payload
  [PASS] ✓ User ML-DSA-65 keypair generation and verification

--- TEST SUITE 2: W3C Verifiable Credentials (VC) ---
  [PASS] ✓ W3C VC successfully formatted and issued
  [PASS] ✓ W3C VC includes dual Classical ECDSA + Post-Quantum ML-DSA proofs
  [PASS] ✓ Verifier validates W3C VC structure, ECDSA, and PQC signatures
  [PASS] ✓ Verifier confirms NIST FIPS 204 Quantum Resistance
  [PASS] ✓ Revoked VC fails cryptographic/status verification

--- TEST SUITE 3: Zero-Trust Policy Engine ---
  [PASS] ✓ Zero-Trust blocks high-security facility entry when biometric factor missing
  [PASS] ✓ Zero-Trust allows entry when VC clearance + biometric factor match
  [PASS] ✓ Zero-Trust denies entry to unauthorized facility (Facility-B)

--- TEST SUITE 4: 6 Defense Attack Scenarios ---
  [PASS] ✓ Attack 1: SIWE Nonce replay prevented (consumed nonce rejected)
  [PASS] ✓ Attack 2: Revoked Identity instantly blocked by Zero-Trust cascade
  [PASS] ✓ Attack 3: Privilege escalation blocked for non-admin accounts
  [PASS] ✓ Attack 4: IDOR protection binds credential strictly to Subject DID
  [PASS] ✓ Attack 5: Asset payload tampering detected via SHA-256 mismatch
  [PASS] ✓ Attack 6: Revoked Verifiable Credential presentation fails

===============================================================
  TEST RESULTS: 19 PASSED / 0 FAILED
===============================================================
```

---

## 5. Security Attack Demonstration for Judges

Navigate to `/dashboard/security-demo` in the application or trigger via API:

1. **Attack 1 (Replay Attack)**: Intercept and replay historical SIWE signature -> **BLOCKED (HTTP 401)**.
2. **Attack 2 (Revoked Identity)**: Revoked DID accessing facility -> **BLOCKED (HTTP 403)**.
3. **Attack 3 (Privilege Escalation)**: Regular user issuing Top Secret VCs -> **BLOCKED (HTTP 403)**.
4. **Attack 4 (IDOR Attack)**: User A requesting User B's classified credential -> **BLOCKED (HTTP 403)**.
5. **Attack 5 (Asset Tampering)**: Modifying stored binary on disk -> SHA-256 mismatch triggers **CRITICAL SOC Alert and locks download (HTTP 500)**.
6. **Attack 6 (Revoked VC)**: Presenting revoked VC at facility -> **BLOCKED (HTTP 403)**.

---

## 6. Compliance Matrix
See [docs/SIH-26125-COMPLIANCE.md](docs/SIH-26125-COMPLIANCE.md) for the detailed 20-point requirement traceability matrix.
