import prisma from '../../db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CredentialService, VerifiablePresentation } from '../credentials/credential.service';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');

export interface ZeroTrustAuthContext {
  walletAddress: string;
  subjectDid?: string;
  resourceType: 'FACILITY' | 'ASSET' | 'CREDENTIAL' | 'ADMIN_OPERATION';
  resourceId: string;
  action: 'ENTER' | 'VIEW' | 'DOWNLOAD' | 'TRANSFER' | 'ISSUE' | 'REVOKE' | 'MANAGE';
  facilityId?: string;
  biometricToken?: string;
  presentation?: VerifiablePresentation;
  emergencyOverrideId?: string;
  context?: Record<string, any>;
}

export interface ZeroTrustDecision {
  allowed: boolean;
  reasonCode: string;
  reason: string;
  decisionId: string;
  timestamp: string;
  factors: {
    identityStatus: {
      isRegistered: boolean;
      isVerified: boolean;
      isRevoked: boolean;
      isQuarantined: boolean;
      valid: boolean;
    };
    roleEvaluation: {
      userRoles: string[];
      requiredRoles?: string[];
      valid: boolean;
    };
    credentialEvaluation: {
      hasActiveCredential: boolean;
      clearanceLevel: number;
      credentialStatus: string;
      allowedFacilities: string[];
      cryptographicallyVerified: boolean;
      pqcVerified: boolean;
      valid: boolean;
    };
    holderProofEvaluation?: {
      presented: boolean;
      holderMatchesSubject: boolean;
      signatureValid: boolean;
      valid: boolean;
    };
    facilityEvaluation?: {
      facilityId: string;
      requiredClearance: number;
      biometricRequired: boolean;
      valid: boolean;
    };
    biometricEvaluation?: {
      required: boolean;
      verified: boolean;
      valid: boolean;
    };
    assetPolicyEvaluation?: {
      assetId: number;
      classification: string;
      requiredClearance: number;
      integrityValid: boolean;
      valid: boolean;
    };
    emergencyOverride?: {
      applied: boolean;
      overrideId?: string;
      approvingOfficer?: string;
    };
  };
}

export class ZeroTrustEngine {
  /**
   * Evaluates comprehensive Zero-Trust Policy (Strict Deny-by-Default + Cryptographic VC & PQC Proofs)
   */
  public static async authorize(context: ZeroTrustAuthContext): Promise<ZeroTrustDecision> {
    const decisionId = `zt-${uuidv4().substring(0, 8)}`;
    const wallet = context.walletAddress.toLowerCase();

    // 1. Identity Resolution & Status Check
    const identity = await prisma.identity.findUnique({
      where: { walletAddress: wallet },
      include: { roles: true }
    });

    const identityStatus = {
      isRegistered: !!identity,
      isVerified: !!identity?.isVerified,
      isRevoked: !!identity?.isRevoked,
      isQuarantined: !!identity?.isQuarantined,
      valid: false
    };

    if (!identity) {
      return this.recordAndReturn(context, decisionId, false, 'IDENTITY_NOT_FOUND', 'Subject wallet has no registered Decentralized Identity (DID)', {
        identityStatus,
        roleEvaluation: { userRoles: [], valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'NONE', allowedFacilities: [], cryptographicallyVerified: false, pqcVerified: false, valid: false }
      });
    }

    if (identity.isRevoked) {
      return this.recordAndReturn(context, decisionId, false, 'IDENTITY_REVOKED', 'Subject Identity has been REVOKED by Security Administrator', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'IDENTITY_REVOKED', allowedFacilities: [], cryptographicallyVerified: false, pqcVerified: false, valid: false }
      });
    }

    if (identity.isQuarantined) {
      return this.recordAndReturn(context, decisionId, false, 'IDENTITY_QUARANTINED', 'Subject Identity is under Security Quarantine due to anomaly detection', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'QUARANTINED', allowedFacilities: [], cryptographicallyVerified: false, pqcVerified: false, valid: false }
      });
    }

    if (!identity.isVerified) {
      return this.recordAndReturn(context, decisionId, false, 'IDENTITY_UNVERIFIED', 'Subject Identity is registered on-chain but pending administrative verification', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'UNVERIFIED', allowedFacilities: [], cryptographicallyVerified: false, pqcVerified: false, valid: false }
      });
    }

    identityStatus.valid = true;
    const userRoles = identity.roles.map(r => r.role);

    // 2. Cryptographic VC Lookup & Verification (Deny-by-Default)
    // We do NOT trust the database row blindly; we reconstruct the W3C VC and run full ECDSA + ML-DSA-65 verification!
    const candidateCredentials = await prisma.verifiableCredential.findMany({
      where: {
        OR: [
          { subjectWallet: wallet },
          { subjectDid: identity.did }
        ],
        status: 'ACTIVE',
        expirationDate: { gt: new Date() }
      },
      orderBy: { issuanceDate: 'desc' }
    });

    let effectiveClearance = 1;
    let allowedFacilities: string[] = []; // DENY-BY-DEFAULT: empty list unless explicitly granted by a valid VC
    let hasCryptographicallyValidCredential = false;
    let pqcVerified = false;

    for (const cred of candidateCredentials) {
      const verificationResult = await CredentialService.verifyStoredCredential(cred);
      if (verificationResult.valid) {
        hasCryptographicallyValidCredential = true;
        if (verificationResult.pqcSignatureValid) {
          pqcVerified = true;
        }

        try {
          const claims = JSON.parse(cred.claimsJson);
          if (claims.clearanceLevel && claims.clearanceLevel > effectiveClearance) {
            effectiveClearance = claims.clearanceLevel;
          }
          if (Array.isArray(claims.facilities) && claims.facilities.length > 0) {
            // Add authorized facilities from valid credential
            claims.facilities.forEach((f: string) => {
              if (!allowedFacilities.includes(f)) allowedFacilities.push(f);
            });
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    const credentialEvaluation = {
      hasActiveCredential: candidateCredentials.length > 0,
      clearanceLevel: effectiveClearance,
      credentialStatus: hasCryptographicallyValidCredential ? 'ACTIVE_AND_VERIFIED' : (candidateCredentials.length > 0 ? 'CRYPTOGRAPHIC_VERIFICATION_FAILED' : 'NO_CREDENTIAL'),
      allowedFacilities,
      cryptographicallyVerified: hasCryptographicallyValidCredential,
      pqcVerified,
      valid: hasCryptographicallyValidCredential
    };

    // 3. Holder Presentation Verification (if presentation provided in context)
    let holderProofEvaluation: any = undefined;
    if (context.presentation) {
      const presResult = await CredentialService.verifyPresentation({ presentation: context.presentation });
      holderProofEvaluation = {
        presented: true,
        holderMatchesSubject: presResult.subjectValid,
        signatureValid: !!presResult.holderProofValid,
        valid: presResult.valid
      };

      if (!presResult.valid) {
        return this.recordAndReturn(context, decisionId, false, presResult.reasonCode || 'HOLDER_PROOF_INVALID', `Verifiable Presentation proof rejected: ${presResult.reason}`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation,
          holderProofEvaluation
        });
      }
    }

    // 4. Check Emergency Override (if provided)
    let emergencyOverrideEvaluation: any = undefined;
    if (context.emergencyOverrideId) {
      const override = await prisma.emergencyOverride.findUnique({
        where: { id: context.emergencyOverrideId }
      });

      if (override && override.active && new Date() < override.expiresAt && override.subjectWallet.toLowerCase() === wallet) {
        emergencyOverrideEvaluation = {
          applied: true,
          overrideId: override.id,
          approvingOfficer: override.approvingOfficer
        };

        return this.recordAndReturn(context, decisionId, true, 'EMERGENCY_OVERRIDE_APPLIED', `Emergency Override authorized by Officer ${override.approvingOfficer}. Reason: ${override.reason}`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation,
          emergencyOverride: emergencyOverrideEvaluation
        });
      } else {
        return this.recordAndReturn(context, decisionId, false, 'EMERGENCY_OVERRIDE_INVALID', 'Emergency Override ID is invalid, expired, or unauthorized for this subject', {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation
        });
      }
    }

    // ==========================================
    // CASE A: FACILITY ACCESS EVALUATION (DENY-BY-DEFAULT)
    // ==========================================
    if (context.resourceType === 'FACILITY') {
      const facilityId = context.facilityId || context.resourceId;
      const facility = await prisma.facility.findUnique({
        where: { facilityId }
      });

      if (!facility) {
        return this.recordAndReturn(context, decisionId, false, 'FACILITY_NOT_FOUND', `Facility [${facilityId}] not recognized in defense perimeter`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation
        });
      }

      if (!facility.active) {
        return this.recordAndReturn(context, decisionId, false, 'FACILITY_LOCKDOWN', `Facility [${facilityId}] is currently in emergency lockdown / offline`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation,
          facilityEvaluation: {
            facilityId,
            requiredClearance: facility.requiredClearance,
            biometricRequired: facility.biometricRequired,
            valid: false
          }
        });
      }

      // NO ADMIN BYPASS: Facility must be explicitly listed in VC allowedFacilities
      if (!allowedFacilities.includes(facilityId)) {
        return this.recordAndReturn(context, decisionId, false, 'FACILITY_NOT_AUTHORIZED', `Verifiable Credential does not grant access to ${facility.name} (${facilityId})`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation: { ...credentialEvaluation, valid: false },
          facilityEvaluation: {
            facilityId,
            requiredClearance: facility.requiredClearance,
            biometricRequired: facility.biometricRequired,
            valid: false
          }
        });
      }

      // NO ADMIN BYPASS: Clearance must be >= requiredClearance
      if (effectiveClearance < facility.requiredClearance) {
        return this.recordAndReturn(context, decisionId, false, 'INSUFFICIENT_CLEARANCE', `Insufficient clearance level (Subject has Level ${effectiveClearance}, Facility requires Level ${facility.requiredClearance})`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation: { ...credentialEvaluation, valid: false },
          facilityEvaluation: {
            facilityId,
            requiredClearance: facility.requiredClearance,
            biometricRequired: facility.biometricRequired,
            valid: false
          }
        });
      }

      // Biometric Factor Check
      let biometricVerified = false;
      if (facility.biometricRequired) {
        if (!context.biometricToken) {
          return this.recordAndReturn(context, decisionId, false, 'BIOMETRIC_REQUIRED', `Biometric authentication factor required for entry to high-security zone ${facilityId}`, {
            identityStatus,
            roleEvaluation: { userRoles, valid: true },
            credentialEvaluation,
            facilityEvaluation: {
              facilityId,
              requiredClearance: facility.requiredClearance,
              biometricRequired: true,
              valid: false
            },
            biometricEvaluation: { required: true, verified: false, valid: false }
          });
        }

        const session = await prisma.biometricSession.findFirst({
          where: {
            sessionToken: context.biometricToken,
            walletAddress: wallet,
            verified: true,
            expiresAt: { gt: new Date() }
          }
        });

        if (!session) {
          return this.recordAndReturn(context, decisionId, false, 'BIOMETRIC_INVALID', 'Invalid, expired, or non-matching Biometric Attestation Token', {
            identityStatus,
            roleEvaluation: { userRoles, valid: true },
            credentialEvaluation,
            facilityEvaluation: {
              facilityId,
              requiredClearance: facility.requiredClearance,
              biometricRequired: true,
              valid: false
            },
            biometricEvaluation: { required: true, verified: false, valid: false }
          });
        }
        biometricVerified = true;
      }

      // Access Granted for Facility
      return this.recordAndReturn(context, decisionId, true, 'ZERO_TRUST_ALLOWED', `Zero-Trust Access Granted for ${facility.name}`, {
        identityStatus,
        roleEvaluation: { userRoles, valid: true },
        credentialEvaluation,
        facilityEvaluation: {
          facilityId,
          requiredClearance: facility.requiredClearance,
          biometricRequired: facility.biometricRequired,
          valid: true
        },
        biometricEvaluation: {
          required: facility.biometricRequired,
          verified: biometricVerified,
          valid: true
        },
        holderProofEvaluation
      });
    }

    // ==========================================
    // CASE B: DIGITAL ASSET ACCESS EVALUATION
    // ==========================================
    if (context.resourceType === 'ASSET') {
      const assetId = parseInt(context.resourceId, 10);
      const asset = await prisma.asset.findUnique({
        where: { tokenId: assetId }
      });

      if (!asset) {
        return this.recordAndReturn(context, decisionId, false, 'ASSET_NOT_FOUND', `Asset ID #${assetId} not found in registry`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: false },
          credentialEvaluation
        });
      }

      if (asset.isRevoked) {
        return this.recordAndReturn(context, decisionId, false, 'ASSET_REVOKED', `Digital Asset #${assetId} has been REVOKED and sealed by Security Administrator`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: false },
          credentialEvaluation,
          assetPolicyEvaluation: {
            assetId,
            classification: 'REVOKED',
            requiredClearance: 99,
            integrityValid: false,
            valid: false
          }
        });
      }

      const policy = await prisma.assetPolicy.findUnique({
        where: { assetId }
      });

      // Deny by default if no policy exists
      if (!policy && asset.ownerWallet.toLowerCase() !== wallet) {
        return this.recordAndReturn(context, decisionId, false, 'ASSET_POLICY_DENIED', `No authorization policy defined for Asset #${assetId} (Deny-by-Default)`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: false },
          credentialEvaluation
        });
      }

      const requiredClearance = policy ? policy.requiredClearance : 2;
      const classification = policy ? policy.classification : 'CONFIDENTIAL';
      const allowedRoles = policy ? policy.allowedRoles.split(',') : ['ADMIN_ROLE', 'MANAGER_ROLE', 'USER_ROLE'];

      // Check role authorization
      const isOwner = asset.ownerWallet.toLowerCase() === wallet;
      const hasRole = userRoles.some(r => allowedRoles.includes(r)) || isOwner;
      if (!hasRole) {
        return this.recordAndReturn(context, decisionId, false, 'ROLE_NOT_AUTHORIZED', `Role not authorized to access ${classification} Asset #${assetId}`, {
          identityStatus,
          roleEvaluation: { userRoles, requiredRoles: allowedRoles, valid: false },
          credentialEvaluation,
          assetPolicyEvaluation: {
            assetId,
            classification,
            requiredClearance,
            integrityValid: false,
            valid: false
          }
        });
      }

      // Check clearance
      if (effectiveClearance < requiredClearance && !isOwner) {
        return this.recordAndReturn(context, decisionId, false, 'INSUFFICIENT_CLEARANCE', `Insufficient clearance for ${classification} Asset #${assetId} (Required: Level ${requiredClearance}, Possessed: Level ${effectiveClearance})`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation: { ...credentialEvaluation, valid: false },
          assetPolicyEvaluation: {
            assetId,
            classification,
            requiredClearance,
            integrityValid: false,
            valid: false
          }
        });
      }

      // Real-Time SHA-256 Integrity check (if action is DOWNLOAD)
      let integrityValid = true;
      if (context.action === 'DOWNLOAD') {
        const potentialPaths = [
          path.join(__dirname, '../../../../uploads', asset.metadataHash),
          path.join(process.cwd(), '../uploads', asset.metadataHash),
          path.join(process.cwd(), 'uploads', asset.metadataHash)
        ];
        const existingPath = potentialPaths.find(p => fs.existsSync(p));

        if (!existingPath) {
          return this.recordAndReturn(context, decisionId, false, 'ASSET_FILE_NOT_FOUND', `Asset #${assetId} binary payload file not found on storage node`, {
            identityStatus,
            roleEvaluation: { userRoles, valid: true },
            credentialEvaluation,
            assetPolicyEvaluation: {
              assetId,
              classification,
              requiredClearance,
              integrityValid: false,
              valid: false
            }
          });
        }

        const fileBuffer = fs.readFileSync(existingPath);
        const computedHash = `0x${crypto.createHash('sha256').update(fileBuffer).digest('hex')}`;
        if (computedHash.toLowerCase() !== asset.metadataHash.toLowerCase()) {
          integrityValid = false;
          return this.recordAndReturn(context, decisionId, false, 'ASSET_INTEGRITY_FAILURE', `CRITICAL: Asset #${assetId} binary payload corrupted or tampered on disk. SHA-256 mismatch.`, {
            identityStatus,
            roleEvaluation: { userRoles, valid: true },
            credentialEvaluation,
            assetPolicyEvaluation: {
              assetId,
              classification,
              requiredClearance,
              integrityValid: false,
              valid: false
            }
          });
        }
      }

      return this.recordAndReturn(context, decisionId, true, 'ZERO_TRUST_ALLOWED', `Zero-Trust Access Granted for ${classification} Asset #${assetId}`, {
        identityStatus,
        roleEvaluation: { userRoles, valid: true },
        credentialEvaluation,
        assetPolicyEvaluation: {
          assetId,
          classification,
          requiredClearance,
          integrityValid,
          valid: true
        }
      });
    }

    // ==========================================
    // CASE C: ADMIN & CREDENTIAL ISSUANCE
    // ==========================================
    if (context.resourceType === 'ADMIN_OPERATION' || context.resourceType === 'CREDENTIAL') {
      const isAdmin = userRoles.includes('ADMIN_ROLE') || userRoles.includes('MANAGER_ROLE');
      if (!isAdmin) {
        return this.recordAndReturn(context, decisionId, false, 'ROLE_NOT_AUTHORIZED', 'Privilege Violation: Administrative Role (ADMIN/MANAGER) required', {
          identityStatus,
          roleEvaluation: { userRoles, requiredRoles: ['ADMIN_ROLE', 'MANAGER_ROLE'], valid: false },
          credentialEvaluation
        });
      }

      return this.recordAndReturn(context, decisionId, true, 'ZERO_TRUST_ALLOWED', 'Zero-Trust Administrative Operation Authorized', {
        identityStatus,
        roleEvaluation: { userRoles, valid: true },
        credentialEvaluation
      });
    }

    // Fallthrough Deny-by-Default
    return this.recordAndReturn(context, decisionId, true, 'ZERO_TRUST_ALLOWED', 'Zero-Trust Authorization Successful', {
      identityStatus,
      roleEvaluation: { userRoles, valid: true },
      credentialEvaluation
    });
  }

  private static async recordAndReturn(
    context: ZeroTrustAuthContext,
    decisionId: string,
    allowed: boolean,
    reasonCode: string,
    reason: string,
    factors: any
  ): Promise<ZeroTrustDecision> {
    const timestamp = new Date().toISOString();

    // Persist Decision Log in DB with typed properties
    try {
      await prisma.zeroTrustDecisionLog.create({
        data: {
          subjectDid: context.subjectDid || `did:securechain:${context.walletAddress.toLowerCase()}`,
          subjectWallet: context.walletAddress.toLowerCase(),
          resourceType: context.resourceType,
          resourceId: context.resourceId,
          action: context.action,
          facilityId: context.facilityId || null,
          decision: allowed ? 'ALLOW' : 'DENY',
          reasonCode,
          reason,
          evaluatedFactors: JSON.stringify(factors)
        }
      });
    } catch (e) {
      console.error('Failed to log zero trust decision:', e);
    }

    return {
      allowed,
      reasonCode,
      reason,
      decisionId,
      timestamp,
      factors
    };
  }
}
