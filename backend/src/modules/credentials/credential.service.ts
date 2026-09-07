import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../db';
import { PqcService } from '../pqc/pqc.service';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

export interface CredentialSubjectClaims {
  employeeId?: string;
  department?: string;
  role?: string;
  clearanceLevel: number; // 1 (Unclassified) to 5 (Top Secret Defense)
  facilities: string[]; // ["FACILITY-A", "FACILITY-B"]
  designation?: string;
  [key: string]: any;
}

export interface W3CVerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: {
    id: string;
    [key: string]: any;
  };
  credentialStatus: {
    id: string;
    type: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    signature: string;
  };
  pqcProof: {
    type: string;
    algorithm: string;
    securityLevel: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    publicKeyHex: string;
    signatureHex: string;
  };
}

export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: W3CVerifiableCredential;
  holder: string;
  proof: {
    type: string;
    created: string;
    challenge: string;
    domain: string;
    verificationMethod: string;
    proofPurpose: string;
    signature: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  reasonCode: string;
  issuerValid: boolean;
  signatureValid: boolean;
  pqcSignatureValid: boolean;
  subjectValid: boolean;
  notExpired: boolean;
  notRevoked: boolean;
  holderProofValid?: boolean;
  details: {
    issuer: string;
    subjectDid: string;
    clearanceLevel?: number;
    facilities?: string[];
    pqcAlgorithm: string;
    expirationDate: string;
    status: string;
  };
  reason: string;
}

// BEL Authority Signer Key (for ECDSA classical layer)
const BEL_AUTHORITY_ETH_KEY = process.env.BEL_AUTHORITY_KEY;
if (!BEL_AUTHORITY_ETH_KEY) {
  throw new Error('FATAL SECURITY CONFIGURATION ERROR: BEL_AUTHORITY_KEY is required in environment variables.');
}

const authorityWallet = new ethers.Wallet(BEL_AUTHORITY_ETH_KEY);
export const BEL_AUTHORITY_DID = 'did:securechain:bel-authority';

export class CredentialService {
  /**
   * Generates a W3C-compliant DID Document for a given DID and wallet address.
   * Subject DID documents reference the subject's own public keys (Secp256k1 & derived Subject PQC key).
   */
  public static generateDidDocument(did: string, walletAddress: string) {
    const subjectPqcPublicKey = PqcService.deriveSubjectPqcPublicKey(walletAddress);
    return {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/ed25519-2020/v1',
        'https://w3id.org/security/suites/jws-2020/v1'
      ],
      id: did,
      controller: did,
      verificationMethod: [
        {
          id: `${did}#key-1`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId: `eip155:31337:${walletAddress}`
        },
        {
          id: `${did}#pqc-key-1`,
          type: 'PostQuantumMlDsa65VerificationKey2026',
          controller: did,
          publicKeyHex: subjectPqcPublicKey,
          standard: 'NIST FIPS 204 (ML-DSA-65)'
        }
      ],
      authentication: [`${did}#key-1`],
      assertionMethod: [`${did}#key-1`, `${did}#pqc-key-1`],
      created: new Date().toISOString()
    };
  }

  /**
   * Issues a W3C Verifiable Credential with Hybrid ECDSA + PQC (ML-DSA-65) Signatures
   */
  public static async issueCredential(params: {
    issuerWallet: string;
    subjectDid: string;
    subjectWallet: string;
    credentialType: string;
    claims: CredentialSubjectClaims;
    expirationDays?: number;
  }): Promise<W3CVerifiableCredential> {
    const credentialId = `urn:uuid:${uuidv4()}`;
    const issuanceDate = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(issuanceDate.getDate() + (params.expirationDays || 365));

    const vcPayload = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/security/suites/jws-2020/v1'
      ],
      id: credentialId,
      type: ['VerifiableCredential', params.credentialType],
      issuer: BEL_AUTHORITY_DID,
      issuanceDate: issuanceDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      credentialSubject: {
        id: params.subjectDid,
        ...params.claims
      },
      credentialStatus: {
        id: `https://securechain.bel.gov.in/credentials/status/${credentialId}`,
        type: 'BELCredentialStatusList2026',
        status: 'ACTIVE' as const
      }
    };

    // 1. Recursive Deterministic Canonical hash of the credential body
    const canonicalHash = PqcService.canonicalHash(vcPayload);
    const hashBytes = ethers.getBytes('0x' + canonicalHash);

    // 2. Classical ECDSA Signature from BEL Authority
    const classicalSig = await authorityWallet.signMessage(hashBytes);

    // 3. Post-Quantum Cryptography (ML-DSA-65) Signature from BEL Authority
    const pqcSig = PqcService.signWithAuthority(canonicalHash);

    const fullVC: W3CVerifiableCredential = {
      ...vcPayload,
      proof: {
        type: 'EcdsaSecp256k1Signature2019',
        created: issuanceDate.toISOString(),
        verificationMethod: `${BEL_AUTHORITY_DID}#key-1`,
        proofPurpose: 'assertionMethod',
        signature: classicalSig
      },
      pqcProof: {
        type: 'PostQuantumMlDsa65Signature2026',
        algorithm: pqcSig.algorithm,
        securityLevel: 'NIST Level 3 (192-bit Quantum Security)',
        created: pqcSig.timestamp,
        verificationMethod: `${BEL_AUTHORITY_DID}#pqc-key-1`,
        proofPurpose: 'assertionMethod',
        publicKeyHex: pqcSig.publicKeyHex,
        signatureHex: pqcSig.signatureHex
      }
    };

    // Store in Database
    await prisma.verifiableCredential.create({
      data: {
        credentialId,
        type: fullVC.type.join(','),
        issuerDid: fullVC.issuer,
        subjectDid: params.subjectDid,
        subjectWallet: params.subjectWallet.toLowerCase(),
        claimsJson: JSON.stringify(params.claims),
        issuanceDate,
        expirationDate,
        status: 'ACTIVE',
        proofJson: JSON.stringify(fullVC.proof),
        pqcProofJson: JSON.stringify(fullVC.pqcProof)
      }
    });

    return fullVC;
  }

  /**
   * Cryptographically verifies a presented W3C Verifiable Credential
   */
  public static async verifyCredential(vc: W3CVerifiableCredential): Promise<VerificationResult> {
    try {
      if (!vc || !vc.id || !vc.issuer || !vc.credentialSubject || !vc.proof || !vc.pqcProof) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_MALFORMED',
          issuerValid: false,
          signatureValid: false,
          pqcSignatureValid: false,
          subjectValid: false,
          notExpired: false,
          notRevoked: false,
          details: {
            issuer: vc?.issuer || 'UNKNOWN',
            subjectDid: vc?.credentialSubject?.id || 'UNKNOWN',
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc?.expirationDate || '',
            status: 'MALFORMED'
          },
          reason: 'Malformed W3C Verifiable Credential structure or missing cryptographic proofs'
        };
      }

      // 1. Validate Issuer
      const issuerValid = vc.issuer === BEL_AUTHORITY_DID;
      if (!issuerValid) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_ISSUER_UNAUTHORIZED',
          issuerValid: false,
          signatureValid: false,
          pqcSignatureValid: false,
          subjectValid: !!vc.credentialSubject.id,
          notExpired: false,
          notRevoked: false,
          details: {
            issuer: vc.issuer,
            subjectDid: vc.credentialSubject.id,
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc.expirationDate,
            status: 'UNAUTHORIZED_ISSUER'
          },
          reason: `Unauthorized Issuer DID [${vc.issuer}]`
        };
      }

      // 2. Validate Expiration
      const notExpired = new Date(vc.expirationDate) > new Date();
      if (!notExpired) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_EXPIRED',
          issuerValid: true,
          signatureValid: false,
          pqcSignatureValid: false,
          subjectValid: true,
          notExpired: false,
          notRevoked: false,
          details: {
            issuer: vc.issuer,
            subjectDid: vc.credentialSubject.id,
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc.expirationDate,
            status: 'EXPIRED'
          },
          reason: `Verifiable Credential expired on ${vc.expirationDate}`
        };
      }

      // 3. Reconstruct canonical payload for signature verification
      const { proof, pqcProof, ...payloadToVerify } = vc;
      const canonicalHash = PqcService.canonicalHash(payloadToVerify);
      const hashBytes = ethers.getBytes('0x' + canonicalHash);

      // 4. Verify Classical ECDSA Signature
      let signatureValid = false;
      try {
        const recoveredAddress = ethers.verifyMessage(hashBytes, proof.signature);
        signatureValid = recoveredAddress.toLowerCase() === authorityWallet.address.toLowerCase();
      } catch (err) {
        signatureValid = false;
      }

      if (!signatureValid) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_SIGNATURE_INVALID',
          issuerValid: true,
          signatureValid: false,
          pqcSignatureValid: false,
          subjectValid: true,
          notExpired: true,
          notRevoked: false,
          details: {
            issuer: vc.issuer,
            subjectDid: vc.credentialSubject.id,
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc.expirationDate,
            status: 'INVALID_SIGNATURE'
          },
          reason: 'Invalid Classical ECDSA signature over canonical credential body'
        };
      }

      // 5. Verify Post-Quantum ML-DSA Signature
      const pqcSignatureValid = PqcService.verifySignature(
        canonicalHash,
        pqcProof.signatureHex,
        pqcProof.publicKeyHex
      );

      if (!pqcSignatureValid) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_PQC_INVALID',
          issuerValid: true,
          signatureValid: true,
          pqcSignatureValid: false,
          subjectValid: true,
          notExpired: true,
          notRevoked: false,
          details: {
            issuer: vc.issuer,
            subjectDid: vc.credentialSubject.id,
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc.expirationDate,
            status: 'INVALID_PQC_SIGNATURE'
          },
          reason: 'Invalid Post-Quantum ML-DSA-65 signature proof (NIST FIPS 204 verification failed)'
        };
      }

      // 6. Check Revocation Status in Database
      const record = await prisma.verifiableCredential.findUnique({
        where: { credentialId: vc.id }
      });

      const notRevoked = !record || record.status === 'ACTIVE';
      if (!notRevoked) {
        return {
          valid: false,
          reasonCode: 'CREDENTIAL_REVOKED',
          issuerValid: true,
          signatureValid: true,
          pqcSignatureValid: true,
          subjectValid: true,
          notExpired: true,
          notRevoked: false,
          details: {
            issuer: vc.issuer,
            subjectDid: vc.credentialSubject.id,
            clearanceLevel: vc.credentialSubject.clearanceLevel,
            facilities: vc.credentialSubject.facilities,
            pqcAlgorithm: 'ML-DSA-65',
            expirationDate: vc.expirationDate,
            status: record?.status || 'REVOKED'
          },
          reason: `Verifiable Credential has been REVOKED (Reason: ${record?.revocationReason || 'Security Revocation'})`
        };
      }

      // 7. Subject check
      const subjectValid = !!vc.credentialSubject.id;

      return {
        valid: true,
        reasonCode: 'CREDENTIAL_VALID',
        issuerValid: true,
        signatureValid: true,
        pqcSignatureValid: true,
        subjectValid,
        notExpired: true,
        notRevoked: true,
        details: {
          issuer: vc.issuer,
          subjectDid: vc.credentialSubject.id,
          clearanceLevel: vc.credentialSubject.clearanceLevel,
          facilities: vc.credentialSubject.facilities,
          pqcAlgorithm: 'ML-DSA-65 (NIST FIPS 204)',
          expirationDate: vc.expirationDate,
          status: 'ACTIVE'
        },
        reason: 'Credential cryptographically valid with active Post-Quantum ML-DSA and ECDSA proofs'
      };
    } catch (error: any) {
      return {
        valid: false,
        reasonCode: 'CREDENTIAL_VERIFICATION_EXCEPTION',
        issuerValid: false,
        signatureValid: false,
        pqcSignatureValid: false,
        subjectValid: false,
        notExpired: false,
        notRevoked: false,
        details: {
          issuer: vc?.issuer || 'UNKNOWN',
          subjectDid: vc?.credentialSubject?.id || 'UNKNOWN',
          pqcAlgorithm: 'ML-DSA-65',
          expirationDate: vc?.expirationDate || '',
          status: 'ERROR'
        },
        reason: `Verification exception: ${error.message}`
      };
    }
  }

  /**
   * Reconstructs and cryptographically verifies a credential stored in the Prisma database
   */
  public static async verifyStoredCredential(record: any): Promise<VerificationResult> {
    try {
      const claims = JSON.parse(record.claimsJson);
      const proof = JSON.parse(record.proofJson);
      const pqcProof = record.pqcProofJson ? JSON.parse(record.pqcProofJson) : null;

      const reconstructedVC: W3CVerifiableCredential = {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://w3id.org/security/suites/jws-2020/v1'
        ],
        id: record.credentialId,
        type: record.type.split(','),
        issuer: record.issuerDid,
        issuanceDate: record.issuanceDate instanceof Date ? record.issuanceDate.toISOString() : record.issuanceDate,
        expirationDate: record.expirationDate instanceof Date ? record.expirationDate.toISOString() : record.expirationDate,
        credentialSubject: {
          id: record.subjectDid,
          ...claims
        },
        credentialStatus: {
          id: `https://securechain.bel.gov.in/credentials/status/${record.credentialId}`,
          type: 'BELCredentialStatusList2026',
          status: record.status as any
        },
        proof,
        pqcProof
      };

      return await this.verifyCredential(reconstructedVC);
    } catch (error: any) {
      return {
        valid: false,
        reasonCode: 'STORED_CREDENTIAL_CORRUPTED',
        issuerValid: false,
        signatureValid: false,
        pqcSignatureValid: false,
        subjectValid: false,
        notExpired: false,
        notRevoked: false,
        details: {
          issuer: record?.issuerDid || 'UNKNOWN',
          subjectDid: record?.subjectDid || 'UNKNOWN',
          pqcAlgorithm: 'ML-DSA-65',
          expirationDate: '',
          status: 'CORRUPTED'
        },
        reason: `Failed to reconstruct and verify stored credential: ${error.message}`
      };
    }
  }

  /**
   * Generates a cryptographically random challenge for holder-bound presentation
   */
  public static async createPresentationChallenge(holderWallet: string, audience: string = 'https://securechain.bel.gov.in'): Promise<{
    challenge: string;
    expiresAt: string;
    audience: string;
  }> {
    const challenge = `pres-challenge-${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.nonceRecord.create({
      data: {
        nonce: challenge,
        walletAddress: holderWallet.toLowerCase(),
        domain: audience,
        expiresAt,
        used: false
      }
    });

    return {
      challenge,
      expiresAt: expiresAt.toISOString(),
      audience
    };
  }

  /**
   * Verifies a holder-bound Verifiable Presentation
   */
  public static async verifyPresentation(params: {
    presentation: VerifiablePresentation;
    expectedAudience?: string;
  }): Promise<VerificationResult> {
    const { presentation, expectedAudience = 'https://securechain.bel.gov.in' } = params;

    if (!presentation || !presentation.verifiableCredential || !presentation.proof || !presentation.holder) {
      return {
        valid: false,
        reasonCode: 'PRESENTATION_MALFORMED',
        issuerValid: false,
        signatureValid: false,
        pqcSignatureValid: false,
        subjectValid: false,
        notExpired: false,
        notRevoked: false,
        holderProofValid: false,
        details: {
          issuer: 'UNKNOWN',
          subjectDid: 'UNKNOWN',
          pqcAlgorithm: 'ML-DSA-65',
          expirationDate: '',
          status: 'MALFORMED'
        },
        reason: 'Malformed Verifiable Presentation payload'
      };
    }

    // 1. Verify single-use challenge in NonceRecord
    const challengeRecord = await prisma.nonceRecord.findUnique({
      where: { nonce: presentation.proof.challenge }
    });

    if (!challengeRecord || challengeRecord.used || new Date() > challengeRecord.expiresAt) {
      return {
        valid: false,
        reasonCode: 'PRESENTATION_CHALLENGE_INVALID',
        issuerValid: false,
        signatureValid: false,
        pqcSignatureValid: false,
        subjectValid: false,
        notExpired: false,
        notRevoked: false,
        holderProofValid: false,
        details: {
          issuer: presentation.verifiableCredential.issuer,
          subjectDid: presentation.holder,
          pqcAlgorithm: 'ML-DSA-65',
          expirationDate: presentation.verifiableCredential.expirationDate,
          status: 'CHALLENGE_EXPIRED'
        },
        reason: 'Presentation challenge is invalid, expired, or already consumed (Replay Protection)'
      };
    }

    // Mark challenge consumed
    await prisma.nonceRecord.update({
      where: { nonce: presentation.proof.challenge },
      data: { used: true }
    });

    // 2. Verify inner Verifiable Credential
    const vcVerification = await this.verifyCredential(presentation.verifiableCredential);
    if (!vcVerification.valid) {
      return {
        ...vcVerification,
        holderProofValid: false
      };
    }

    // 3. Verify Holder Binding: Holder DID must match Credential Subject DID
    const subjectDid = presentation.verifiableCredential.credentialSubject.id;
    if (presentation.holder.toLowerCase() !== subjectDid.toLowerCase()) {
      return {
        valid: false,
        reasonCode: 'HOLDER_MISMATCH',
        issuerValid: true,
        signatureValid: true,
        pqcSignatureValid: true,
        subjectValid: false,
        notExpired: true,
        notRevoked: true,
        holderProofValid: false,
        details: vcVerification.details,
        reason: `Holder DID [${presentation.holder}] does not match Credential Subject DID [${subjectDid}] (Identity Substitution Detected)`
      };
    }

    // 4. Verify Holder Signature over Presentation Challenge
    const presentationMessage = `BEL-PRESENTATION-PROOF:${presentation.proof.challenge}:${presentation.proof.domain}:${presentation.holder}`;
    let holderSignatureValid = false;
    try {
      const recoveredAddress = ethers.verifyMessage(presentationMessage, presentation.proof.signature);
      // Holder DID is did:securechain:0xaddress
      const expectedAddress = presentation.holder.replace('did:securechain:', '').toLowerCase();
      holderSignatureValid = recoveredAddress.toLowerCase() === expectedAddress;
    } catch (e) {
      holderSignatureValid = false;
    }

    if (!holderSignatureValid) {
      return {
        valid: false,
        reasonCode: 'HOLDER_PROOF_INVALID',
        issuerValid: true,
        signatureValid: true,
        pqcSignatureValid: true,
        subjectValid: true,
        notExpired: true,
        notRevoked: true,
        holderProofValid: false,
        details: vcVerification.details,
        reason: 'Invalid Holder cryptographic signature on presentation challenge'
      };
    }

    return {
      ...vcVerification,
      holderProofValid: true,
      reasonCode: 'PRESENTATION_VERIFIED',
      reason: 'Verifiable Presentation and Holder Proof-of-Possession cryptographically verified'
    };
  }

  /**
   * Revoke a credential by ID with audit trail
   */
  public static async revokeCredential(credentialId: string, reason: string, actorWallet: string) {
    const cred = await prisma.verifiableCredential.findUnique({
      where: { credentialId }
    });

    if (!cred) {
      throw new Error(`Credential ${credentialId} not found`);
    }

    const updated = await prisma.verifiableCredential.update({
      where: { credentialId },
      data: {
        status: 'REVOKED',
        revocationReason: reason
      }
    });

    return updated;
  }
}
