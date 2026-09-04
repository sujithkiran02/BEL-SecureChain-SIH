import prisma from '../../db';

export class SocService {
  /**
   * Calculate global threat score (0 - 100%) and system metrics
   */
  async getSocStats() {
    const totalIdentities = await (prisma as any).identity.count();
    const quarantinedCount = await (prisma as any).identity.count({ where: { isQuarantined: true } });
    const revokedCount = await (prisma as any).identity.count({ where: { isRevoked: true } });
    const totalAudits = await (prisma as any).auditEntry.count();
    const activeAlerts = await (prisma as any).securityAlert.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Threat Score formula based on active critical/high alerts + quarantined ratios
    let threatScore = 12; // Base defense posture baseline
    for (const alert of activeAlerts) {
      if (alert.severity === 'CRITICAL') threatScore += 25;
      else if (alert.severity === 'HIGH') threatScore += 15;
      else if (alert.severity === 'MEDIUM') threatScore += 5;
    }
    threatScore += quarantinedCount * 10;
    threatScore = Math.min(100, threatScore);

    const threatLevel =
      threatScore >= 75 ? 'CRITICAL (DEFCON 1)' :
      threatScore >= 50 ? 'HIGH (DEFCON 2)' :
      threatScore >= 25 ? 'ELEVATED (DEFCON 3)' : 'NOMINAL (DEFCON 5)';

    return {
      threatScore,
      threatLevel,
      totalIdentities,
      quarantinedCount,
      revokedCount,
      totalAudits,
      activeAlertsCount: activeAlerts.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Fetch all security alerts
   */
  async getAlerts() {
    return (prisma as any).securityAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Toggle emergency quarantine for a given wallet
   */
  async toggleQuarantine(walletAddress: string, shouldQuarantine: boolean, reason?: string) {
    const identity = await (prisma as any).identity.findUnique({ where: { walletAddress } });
    if (!identity) {
      throw new Error(`Identity with wallet address ${walletAddress} not found.`);
    }

    const updated = await (prisma as any).identity.update({
      where: { walletAddress },
      data: { isQuarantined: shouldQuarantine },
    });

    // Record an alert for audit
    await (prisma as any).securityAlert.create({
      data: {
        severity: shouldQuarantine ? 'CRITICAL' : 'LOW',
        tactic: shouldQuarantine ? 'Emergency Circuit Breaker' : 'Quarantine Cleared',
        description: shouldQuarantine
          ? `[CIRCUIT BREAKER ACTIVATED] Wallet ${walletAddress} placed in emergency quarantine. Reason: ${reason || 'Commander directive'}`
          : `Wallet ${walletAddress} emergency quarantine lifted.`,
        targetWallet: walletAddress,
        threatScore: shouldQuarantine ? 85 : 0,
        status: shouldQuarantine ? 'QUARANTINED' : 'RESOLVED',
      },
    });

    return updated;
  }

  /**
   * Fetch list of currently quarantined identities
   */
  async getQuarantinedIdentities() {
    return (prisma as any).identity.findMany({
      where: { isQuarantined: true },
      include: { roles: true },
    });
  }

  /**
   * Demo Simulation: Injects a realistic defense cyber incident to demonstrate real-time SOC response to judges
   */
  async simulateAttack(attackType: 'EXFILTRATION' | 'PRIVILEGE_DRIFT' | 'OFF_HOURS_BURST', actorWallet?: string) {
    const wallet = actorWallet || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    let severity = 'HIGH';
    let tactic = 'Privilege Escalation';
    let description = '';
    let threatScore = 75;

    switch (attackType) {
      case 'EXFILTRATION':
        severity = 'CRITICAL';
        tactic = 'Mass Classified Exfiltration';
        description = `Anomalous burst download detected: 14 classified schematic hashes accessed within 8 seconds by wallet ${wallet}`;
        threatScore = 90;
        break;
      case 'PRIVILEGE_DRIFT':
        severity = 'HIGH';
        tactic = 'Unauthorized Privilege Probe';
        description = `Non-admin identity ${wallet} repeatedly attempted to call AccessControlManager.grantRole on unverified node`;
        threatScore = 70;
        break;
      case 'OFF_HOURS_BURST':
        severity = 'HIGH';
        tactic = 'Off-Hours Anomalous Velocity';
        description = `Identity ${wallet} initiated tactical asset transfer outside designated operational mission hours (03:14 UTC)`;
        threatScore = 65;
        break;
    }

    const alert = await (prisma as any).securityAlert.create({
      data: {
        severity,
        tactic,
        description,
        targetWallet: wallet,
        threatScore,
        status: 'ACTIVE',
      },
    });

    return alert;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: number) {
    return (prisma as any).securityAlert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED' },
    });
  }
}
