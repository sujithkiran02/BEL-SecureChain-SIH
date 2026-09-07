import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../db';
import { PqcService } from '../pqc/pqc.service';

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

export interface VerificationResult {
  valid: boolean;
  issuerValid: boolean;
  signatureValid: boolean;
  pqcSignatureValid: boolean;
  subjectValid: boolean;
  notExpired: boolean;
  notRevoked: boolean;
  details: {
    issuer: string;
    subjectDid: string;
    clearanceLevel?: number;
    facilities?: string[];
    pqcAlgorithm: string;
    expirationDate: string;
    status: string;
  };
  reason?: string;
}

// BEL Authority Signer Key (for ECDSA classical layer)
const BEL_AUTHORITY_ETH_KEY = process.env.BEL_AUTHORITY_KEY || '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const authorityWallet = new ethers.Wallet(BEL_AUTHORITY_ETH_KEY);
export const BEL_AUTHORITY_DID = 'did:securechain:bel-authority';

export class CredentialService {
  /**
   * Generates a W3C-compliant DID Document for a given DID and wallet address
   */
  public static generateDidDocument(did: string, walletAddress: string) {
    const authorityPqc = PqcService.getAuthorityPublicKey();
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
          publicKeyHex: authorityPqc.publicKeyHex,
          standard: authorityPqc.fipsStandard
        }
      ],
      authentication: [`${did}#key-1`],
      assertionMethod: [`${did}#key-1`, `${did}#pqc-key-1`],
      created: new Date().toISOString()
    };
  }

  /**
   * Issues a W3C Verifiable Credential with Hybrid ECDSA + PQC (ML-DSA) Signatures
   */
  public static async issueCredential(params: {
    issuerWallet: string;
    subjectDid: string;
    subjectWallet: string;
    credentialType: string; // e.g. "EmployeeCredential" | "SecurityClearanceCredential"
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

    // 1. Canonical hash of the credential body
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
   * Cryptographically verifies a presented W3C Verifiable Credential (Classical + PQC + Status)
   */
  public static async verifyCredential(vc: W3CVerifiableCredential): Promise<VerificationResult> {
    try {
      if (!vc || !vc.id || !vc.issuer || !vc.credentialSubject || !vc.proof || !vc.pqcProof) {
        return {
          valid: false,
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

      // 2. Validate Expiration
      const notExpired = new Date(vc.expirationDate) > new Date();

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

      // 5. Verify Post-Quantum ML-DSA Signature
      const pqcSignatureValid = PqcService.verifySignature(
        canonicalHash,
        pqcProof.signatureHex,
        pqcProof.publicKeyHex
      );

      // 6. Check Revocation Status in Database
      const record = await prisma.verifiableCredential.findUnique({
        where: { credentialId: vc.id }
      });

      const notRevoked = !record || record.status === 'ACTIVE';

      // 7. Verify Subject Identity
      const subjectValid = !!vc.credentialSubject.id;

      const isValid = issuerValid && signatureValid && pqcSignatureValid && notExpired && notRevoked && subjectValid;

      let reason = 'Credential cryptographically valid with active Post-Quantum ML-DSA and ECDSA proofs';
      if (!issuerValid) reason = 'Unauthorized Issuer DID';
      else if (!signatureValid) reason = 'Invalid Classical ECDSA Signature';
      else if (!pqcSignatureValid) reason = 'Invalid Post-Quantum ML-DSA-65 Signature Proof';
      else if (!notExpired) reason = 'Verifiable Credential has expired';
      else if (!notRevoked) reason = `Credential is revoked or suspended (Status: ${record?.status || 'REVOKED'})`;

      return {
        valid: isValid,
        issuerValid,
        signatureValid,
        pqcSignatureValid,
        subjectValid,
        notExpired,
        notRevoked,
        details: {
          issuer: vc.issuer,
          subjectDid: vc.credentialSubject.id,
          clearanceLevel: vc.credentialSubject.clearanceLevel,
          facilities: vc.credentialSubject.facilities,
          pqcAlgorithm: 'ML-DSA-65 (NIST FIPS 204)',
          expirationDate: vc.expirationDate,
          status: notRevoked ? 'ACTIVE' : (record?.status || 'REVOKED')
        },
        reason
      };
    } catch (error: any) {
      return {
        valid: false,
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
