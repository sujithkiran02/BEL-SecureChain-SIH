import { Request, Response } from 'express';
import prisma from '../../db';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const activeUsers = await prisma.identity.count({ where: { isRevoked: false } });
    const totalAssets = await prisma.asset.count({ where: { isRevoked: false } });
    const auditLogsCount = await prisma.auditEntry.count();
    
    // Simulate some logic for Contract Execution rate (can be ratio of successful logs vs all logs)
    const successLogsCount = await prisma.auditEntry.count({
      where: {
        actionType: {
          notIn: ['IDENTITY_REVOKED', 'ASSET_REVOKED', 'ROLE_REVOKED']
        }
      }
    });

    const executionRate = auditLogsCount === 0 ? 100 : Math.round((successLogsCount / auditLogsCount) * 100);

    // Get the latest 4 audit logs for the dashboard
    const latestLogs = await prisma.auditEntry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 4
    });

    res.json({
      stats: {
        activeUsers,
        totalAssets,
        executionRate,
        networkHealth: 100
      },
      latestLogs
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
