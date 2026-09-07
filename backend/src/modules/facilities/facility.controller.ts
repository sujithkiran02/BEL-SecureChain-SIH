import { Request, Response } from 'express';
import prisma from '../../db';
import { ZeroTrustEngine } from '../zero-trust/zero-trust.service';

// Seed default defense facilities on module load
export async function ensureDefaultFacilities() {
  const defaultFacilities = [
    {
      facilityId: 'FACILITY-A',
      name: 'BEL Central Headquarters & Command Center',
      location: 'Bangalore, India',
      classification: 'SECRET',
      requiredClearance: 3,
      allowedRoles: 'ADMIN_ROLE,MANAGER_ROLE,USER_ROLE',
      biometricRequired: true
    },
    {
      facilityId: 'FACILITY-B',
      name: 'BEL Advanced Defense Radar & Electronic Warfare Lab',
      location: 'Ghaziabad, India',
      classification: 'TOP_SECRET',
      requiredClearance: 4,
      allowedRoles: 'ADMIN_ROLE,MANAGER_ROLE',
      biometricRequired: true
    },
    {
      facilityId: 'FACILITY-C',
      name: 'BEL Regional Avionics & Testing Station',
      location: 'Pune, India',
      classification: 'CONFIDENTIAL',
      requiredClearance: 2,
      allowedRoles: 'ADMIN_ROLE,MANAGER_ROLE,USER_ROLE',
      biometricRequired: false
    }
  ];

  for (const fac of defaultFacilities) {
    await prisma.facility.upsert({
      where: { facilityId: fac.facilityId },
      update: {},
      create: fac
    });
  }
}

export class FacilityController {
  /**
   * GET /api/facilities
   * List all defense facilities and their security requirements
   */
  public static async listFacilities(req: Request, res: Response): Promise<void> {
    try {
      await ensureDefaultFacilities();
      const facilities = await prisma.facility.findMany({
        orderBy: { facilityId: 'asc' }
      });
      res.json({ facilities });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve defense facilities' });
    }
  }

  /**
   * POST /api/facilities/:id/request-access
   * Evaluates dynamic Zero-Trust entry decision
   */
  public static async requestAccess(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = (req as any).user.address;
      const facilityId = String(req.params.id);
      const { biometricToken } = req.body;

      const identity = await prisma.identity.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() }
      });

      const subjectDid = identity ? identity.did : `did:securechain:${walletAddress.toLowerCase()}`;

      // Run through Zero-Trust Engine
      const decision = await ZeroTrustEngine.authorize({
        walletAddress,
        subjectDid,
        resourceType: 'FACILITY',
        resourceId: facilityId,
        facilityId,
        action: 'ENTER',
        biometricToken
      });

      // Log into FacilityAccessLog
      await prisma.facilityAccessLog.create({
        data: {
          facilityId,
          subjectDid,
          subjectWallet: walletAddress.toLowerCase(),
          decision: decision.allowed ? 'ALLOW' : 'DENY',
          reason: decision.reason,
          biometricVerified: !!decision.factors.biometricEvaluation?.verified,
          clearanceLevel: decision.factors.credentialEvaluation?.clearanceLevel || 1
        }
      });

      // If denied, log a SOC threat alert for unauthorized facility entry
      if (!decision.allowed) {
        await prisma.securityAlert.create({
          data: {
            severity: 'HIGH',
            tactic: 'Unauthorized Physical/Logical Facility Breach',
            description: `Unauthorized entry attempt to ${facilityId} by ${subjectDid}. Reason: ${decision.reason}`,
            targetWallet: walletAddress.toLowerCase(),
            threatScore: 75,
            status: 'ACTIVE'
          }
        });
      }

      res.status(decision.allowed ? 200 : 403).json({
        accessGranted: decision.allowed,
        decision
      });
    } catch (error: any) {
      console.error('Facility access request error:', error);
      res.status(500).json({ error: 'Failed to process facility access evaluation' });
    }
  }

  /**
   * GET /api/facilities/logs
   * List recent facility entry attempt logs
   */
  public static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await prisma.facilityAccessLog.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: { facility: true }
      });
      res.json({ logs });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch facility access logs' });
    }
  }
}
