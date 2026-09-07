import { Request, Response } from 'express';
import prisma from '../../db';
import { PqcService } from '../pqc/pqc.service';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Identity metrics
    const totalIdentities = await prisma.identity.count();
    const activeIdentities = await prisma.identity.count({ where: { isRevoked: false, isVerified: true } });
    const verifiedIdentities = await prisma.identity.count({ where: { isVerified: true } });
    const revokedIdentities = await prisma.identity.count({ where: { isRevoked: true } });
    const quarantinedIdentities = await prisma.identity.count({ where: { isQuarantined: true } });

    // Verifiable Credential metrics
    const totalCredentials = await prisma.verifiableCredential.count();
    const activeCredentials = await prisma.verifiableCredential.count({ where: { status: 'ACTIVE' } });
    const revokedCredentials = await prisma.verifiableCredential.count({ where: { status: 'REVOKED' } });

    // Digital Asset metrics
    const totalAssets = await prisma.asset.count();
    const activeAssets = await prisma.asset.count({ where: { isRevoked: false } });
    const revokedAssets = await prisma.asset.count({ where: { isRevoked: true } });

    // Zero-Trust & Access metrics
    const totalDecisions = await prisma.zeroTrustDecisionLog.count();
    const allowedDecisions = await prisma.zeroTrustDecisionLog.count({ where: { decision: 'ALLOW' } });
    const deniedDecisions = await prisma.zeroTrustDecisionLog.count({ where: { decision: 'DENY' } });
    const facilityAttempts = await prisma.facilityAccessLog.count();

    // Security & Threat alerts
    const activeAlerts = await prisma.securityAlert.count({ where: { status: 'ACTIVE' } });
    const criticalAlerts = await prisma.securityAlert.count({ where: { severity: 'CRITICAL', status: 'ACTIVE' } });

    // Audit logs count
    const auditLogsCount = await prisma.auditEntry.count();

    // Latest audit timeline logs
    const latestLogs = await prisma.auditEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 8
    });

    const pqcInfo = PqcService.getAuthorityPublicKey();

    res.json({
      stats: {
        identities: {
          total: totalIdentities,
          active: activeIdentities,
          verified: verifiedIdentities,
          revoked: revokedIdentities,
          quarantined: quarantinedIdentities
        },
        credentials: {
          total: totalCredentials,
          active: activeCredentials,
          revoked: revokedCredentials
        },
        assets: {
          total: totalAssets,
          active: activeAssets,
          revoked: revokedAssets
        },
        zeroTrust: {
          totalEvaluations: totalDecisions,
          allowed: allowedDecisions,
          denied: deniedDecisions,
          facilityAttempts
        },
        soc: {
          activeAlerts,
          criticalAlerts
        },
        postQuantum: {
          status: 'OPERATIONAL',
          algorithm: pqcInfo.algorithm,
          securityLevel: pqcInfo.securityLevel,
          fipsStandard: pqcInfo.fipsStandard
        },
        activeUsers: activeIdentities,
        totalAssets: activeAssets,
        executionRate: totalDecisions === 0 ? 100 : Math.round((allowedDecisions / totalDecisions) * 100),
        networkHealth: 100
      },
      latestLogs
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
