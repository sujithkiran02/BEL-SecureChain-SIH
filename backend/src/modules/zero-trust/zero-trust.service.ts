import prisma from '../../db';
import { v4 as uuidv4 } from 'uuid';

export interface ZeroTrustAuthContext {
  walletAddress: string;
  subjectDid?: string;
  resourceType: 'FACILITY' | 'ASSET' | 'CREDENTIAL' | 'ADMIN_OPERATION';
  resourceId: string;
  action: 'ENTER' | 'VIEW' | 'DOWNLOAD' | 'TRANSFER' | 'ISSUE' | 'REVOKE' | 'MANAGE';
  facilityId?: string;
  biometricToken?: string;
  context?: Record<string, any>;
}

export interface ZeroTrustDecision {
  allowed: boolean;
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
  };
}

export class ZeroTrustEngine {
  /**
   * Evaluates comprehensive Zero-Trust Policy (ABAC + RBAC + Multi-Facility + Biometrics)
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
      return this.recordAndReturn(context, decisionId, false, 'Subject wallet has no registered Decentralized Identity (DID)', {
        identityStatus,
        roleEvaluation: { userRoles: [], valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'NONE', allowedFacilities: [], valid: false }
      });
    }

    if (identity.isRevoked) {
      return this.recordAndReturn(context, decisionId, false, 'Subject Identity has been REVOKED by Security Administrator', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'IDENTITY_REVOKED', allowedFacilities: [], valid: false }
      });
    }

    if (identity.isQuarantined) {
      return this.recordAndReturn(context, decisionId, false, 'Subject Identity is under Security Quarantine due to anomaly detection', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'QUARANTINED', allowedFacilities: [], valid: false }
      });
    }

    if (!identity.isVerified) {
      return this.recordAndReturn(context, decisionId, false, 'Subject Identity is registered but pending verification', {
        identityStatus,
        roleEvaluation: { userRoles: identity.roles.map(r => r.role), valid: false },
        credentialEvaluation: { hasActiveCredential: false, clearanceLevel: 0, credentialStatus: 'UNVERIFIED', allowedFacilities: [], valid: false }
      });
    }

    identityStatus.valid = true;

    // 2. Fetch Active Verifiable Credentials for Subject
    const userRoles = identity.roles.map(r => r.role);
    const credentials = await prisma.verifiableCredential.findMany({
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
    let allowedFacilities: string[] = ['FACILITY-A', 'FACILITY-B', 'FACILITY-C'];
    let hasActiveCredential = credentials.length > 0;

    if (hasActiveCredential) {
      for (const cred of credentials) {
        try {
          const claims = JSON.parse(cred.claimsJson);
          if (claims.clearanceLevel && claims.clearanceLevel > effectiveClearance) {
            effectiveClearance = claims.clearanceLevel;
          }
          if (Array.isArray(claims.facilities) && claims.facilities.length > 0) {
            allowedFacilities = claims.facilities;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    }

    const credentialEvaluation = {
      hasActiveCredential,
      clearanceLevel: effectiveClearance,
      credentialStatus: hasActiveCredential ? 'ACTIVE' : 'NO_ACTIVE_CREDENTIAL',
      allowedFacilities,
      valid: hasActiveCredential
    };

    // 3. Evaluate Resource-Specific Policies

    // ==========================================
    // CASE A: FACILITY ACCESS EVALUATION
    // ==========================================
    if (context.resourceType === 'FACILITY') {
      const facilityId = context.facilityId || context.resourceId;
      const facility = await prisma.facility.findUnique({
        where: { facilityId }
      });

      if (!facility) {
        return this.recordAndReturn(context, decisionId, false, `Facility ${facilityId} not recognized in defense perimeter`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation
        });
      }

      if (!facility.active) {
        return this.recordAndReturn(context, decisionId, false, `Facility ${facilityId} is currently offline / in lockdown`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation
        });
      }

      // Check facility allowed in VC claims
      if (!allowedFacilities.includes(facilityId) && !userRoles.includes('ADMIN_ROLE')) {
        return this.recordAndReturn(context, decisionId, false, `Verifiable Credential does not authorize access to ${facility.name} (${facilityId})`, {
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

      // Check clearance level
      if (effectiveClearance < facility.requiredClearance && !userRoles.includes('ADMIN_ROLE')) {
        return this.recordAndReturn(context, decisionId, false, `Insufficient clearance level (Subject has Level ${effectiveClearance}, Facility requires Level ${facility.requiredClearance})`, {
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

      // Check biometric requirement
      let biometricVerified = false;
      if (facility.biometricRequired) {
        if (!context.biometricToken) {
          return this.recordAndReturn(context, decisionId, false, `Biometric authentication factor required for entry to high-security zone ${facilityId}`, {
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
          return this.recordAndReturn(context, decisionId, false, 'Invalid or expired Biometric Attestation Token', {
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
      return this.recordAndReturn(context, decisionId, true, `Zero-Trust Access Granted for ${facility.name}`, {
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
        }
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
        return this.recordAndReturn(context, decisionId, false, `Asset ID #${assetId} not found`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: false },
          credentialEvaluation
        });
      }

      if (asset.isRevoked) {
        return this.recordAndReturn(context, decisionId, false, `Digital Asset #${assetId} has been REVOKED and sealed`, {
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

      const requiredClearance = policy ? policy.requiredClearance : 2;
      const classification = policy ? policy.classification : 'CONFIDENTIAL';
      const allowedRoles = policy ? policy.allowedRoles.split(',') : ['ADMIN_ROLE', 'MANAGER_ROLE', 'USER_ROLE'];

      // Check role authorization
      const hasRole = userRoles.some(r => allowedRoles.includes(r)) || asset.ownerWallet.toLowerCase() === wallet;
      if (!hasRole && !userRoles.includes('ADMIN_ROLE')) {
        return this.recordAndReturn(context, decisionId, false, `Role not authorized to access ${classification} Asset #${assetId}`, {
          identityStatus,
          roleEvaluation: { userRoles, requiredRoles: allowedRoles, valid: false },
          credentialEvaluation,
          assetPolicyEvaluation: {
            assetId,
            classification,
            requiredClearance,
            integrityValid: true,
            valid: false
          }
        });
      }

      // Check clearance
      if (effectiveClearance < requiredClearance && asset.ownerWallet.toLowerCase() !== wallet && !userRoles.includes('ADMIN_ROLE')) {
        return this.recordAndReturn(context, decisionId, false, `Insufficient clearance level for ${classification} Asset #${assetId} (Required: Level ${requiredClearance}, Possessed: Level ${effectiveClearance})`, {
          identityStatus,
          roleEvaluation: { userRoles, valid: true },
          credentialEvaluation: { ...credentialEvaluation, valid: false },
          assetPolicyEvaluation: {
            assetId,
            classification,
            requiredClearance,
            integrityValid: true,
            valid: false
          }
        });
      }

      return this.recordAndReturn(context, decisionId, true, `Zero-Trust Access Granted for ${classification} Asset #${assetId}`, {
        identityStatus,
        roleEvaluation: { userRoles, valid: true },
        credentialEvaluation,
        assetPolicyEvaluation: {
          assetId,
          classification,
          requiredClearance,
          integrityValid: true,
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
        return this.recordAndReturn(context, decisionId, false, 'Privilege Violation: Administrative Role (ADMIN/MANAGER) required', {
          identityStatus,
          roleEvaluation: { userRoles, requiredRoles: ['ADMIN_ROLE', 'MANAGER_ROLE'], valid: false },
          credentialEvaluation
        });
      }

      return this.recordAndReturn(context, decisionId, true, 'Zero-Trust Administrative Operation Authorized', {
        identityStatus,
        roleEvaluation: { userRoles, valid: true },
        credentialEvaluation
      });
    }

    // Default Fallthrough
    return this.recordAndReturn(context, decisionId, true, 'Zero-Trust Authorization Successful', {
      identityStatus,
      roleEvaluation: { userRoles, valid: true },
      credentialEvaluation
    });
  }

  private static async recordAndReturn(
    context: ZeroTrustAuthContext,
    decisionId: string,
    allowed: boolean,
    reason: string,
    factors: any
  ): Promise<ZeroTrustDecision> {
    const timestamp = new Date().toISOString();

    // Persist Decision Log in DB
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
          reason,
          evaluatedFactors: JSON.stringify(factors)
        }
      });
    } catch (e) {
      console.error('Failed to log zero trust decision:', e);
    }

    return {
      allowed,
      reason,
      decisionId,
      timestamp,
      factors
    };
  }
}
