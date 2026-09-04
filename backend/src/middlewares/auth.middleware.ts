import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import prisma from '../db';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if the identity is revoked in the database to invalidate old JWTs
    const identity = await prisma.identity.findUnique({
      where: { walletAddress: decoded.address },
      include: { roles: true }
    });

    if (!identity) {
      return res.status(401).json({ error: 'Identity not found' });
    }

    if (identity.isRevoked) {
      return res.status(403).json({ error: 'Identity has been revoked' });
    }

    if ((identity as any).isQuarantined) {
      return res.status(403).json({ error: 'Identity placed under SOC Emergency Quarantine (DEFCON Circuit Breaker)' });
    }

    (req as any).user = {
      ...decoded,
      roles: identity.roles.map((r: any) => r.role)
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = requiredRoles.some(role => user.roles.includes(role));
    if (!hasRole && !user.roles.includes('ADMIN_ROLE')) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
