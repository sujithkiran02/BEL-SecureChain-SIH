import { Request, Response } from 'express';
import { CredentialService } from './credential.service';
import prisma from '../../db';
import { PqcService } from '../pqc/pqc.service';

export class CredentialController {
  /**
   * POST /api/credentials/issue
   * Issue a new W3C Verifiable Credential with hybrid ECDSA + PQC ML-DSA proof
   */
  public static async issue(req: Request, res: Response): Promise<void> {
    try {
      const issuerWallet = (req as any).user.address;
      const { subjectDid, subjectWallet, credentialType, claims, expirationDays } = req.body;

      if (!subjectDid || !claims || claims.clearanceLevel === undefined) {
        res.status(400).json({ error: 'Missing required parameters: subjectDid, claims (with clearanceLevel)' });
        return;
      }

      // Check if subject identity exists
      const targetWallet = subjectWallet ? subjectWallet.toLowerCase() : null;
      let identity = null;
      if (targetWallet) {
        identity = await prisma.identity.findUnique({ where: { walletAddress: targetWallet } });
      } else {
        identity = await prisma.identity.findUnique({ where: { did: subjectDid } });
      }

      const resolvedWallet = identity ? identity.walletAddress : (targetWallet || issuerWallet);

      const vc = await CredentialService.issueCredential({
        issuerWallet,
        subjectDid,
        subjectWallet: resolvedWallet,
        credentialType: credentialType || 'EmployeeCredential',
        claims: {
          ...claims,
          facilities: claims.facilities || ['FACILITY-A'],
          clearanceLevel: Number(claims.clearanceLevel) || 1
        },
        expirationDays: Number(expirationDays) || 365
      });

      res.status(201).json({
        success: true,
        message: 'W3C Verifiable Credential issued with Dual ECDSA + Post-Quantum ML-DSA Signatures',
        credential: vc
      });
    } catch (error: any) {
      console.error('Credential issuance error:', error);
      res.status(500).json({ error: error.message || 'Failed to issue credential' });
    }
  }

  /**
   * GET /api/credentials/my-credentials
   * Retrieve all credentials belonging to the authenticated user's wallet / DID
   */
  public static async getMyCredentials(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = (req as any).user.address.toLowerCase();
      const identity = await prisma.identity.findUnique({
        where: { walletAddress }
      });

      const whereClause: any = {
        OR: [
          { subjectWallet: walletAddress }
        ]
      };

      if (identity) {
        whereClause.OR.push({ subjectDid: identity.did });
      }

      const records = await prisma.verifiableCredential.findMany({
        where: whereClause,
        orderBy: { issuanceDate: 'desc' }
      });

      const formatted = records.map(rec => ({
        id: rec.credentialId,
        type: rec.type.split(','),
        issuer: rec.issuerDid,
        subjectDid: rec.subjectDid,
        subjectWallet: rec.subjectWallet,
        claims: JSON.parse(rec.claimsJson),
        issuanceDate: rec.issuanceDate,
        expirationDate: rec.expirationDate,
        status: rec.status,
        revocationReason: rec.revocationReason,
        proof: JSON.parse(rec.proofJson),
        pqcProof: rec.pqcProofJson ? JSON.parse(rec.pqcProofJson) : null
      }));

      res.json({ credentials: formatted });
    } catch (error: any) {
      console.error('Fetch credentials error:', error);
      res.status(500).json({ error: 'Failed to retrieve credentials' });
    }
  }

  /**
   * GET /api/credentials/:id
   * IDOR-protected fetch of a single credential
   */
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const callerWallet = user.address.toLowerCase();
      const id = String(req.params.id);

      const record = await prisma.verifiableCredential.findFirst({
        where: {
          OR: [
            { id: id },
            { credentialId: id }
          ]
        }
      });

      if (!record) {
        res.status(404).json({ error: 'Verifiable Credential not found' });
        return;
      }

      // IDOR Protection: Check if caller is owner or admin
      const isOwner = record.subjectWallet.toLowerCase() === callerWallet;
      const roles = user.roles || [];
      const isAdmin = roles.includes('ADMIN_ROLE') || roles.includes('MANAGER_ROLE') || roles.includes('AUDITOR_ROLE');

      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Access Denied: You do not own this credential' });
        return;
      }

      res.json({
        credential: {
          id: record.credentialId,
          type: record.type.split(','),
          issuer: record.issuerDid,
          subjectDid: record.subjectDid,
          subjectWallet: record.subjectWallet,
          claims: JSON.parse(record.claimsJson),
          issuanceDate: record.issuanceDate,
          expirationDate: record.expirationDate,
          status: record.status,
          revocationReason: record.revocationReason,
          proof: JSON.parse(record.proofJson),
          pqcProof: record.pqcProofJson ? JSON.parse(record.pqcProofJson) : null
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch credential' });
    }
  }

  /**
   * POST /api/credentials/verify
   * Cryptographically verifies a presented W3C Verifiable Credential
   */
  public static async verify(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(400).json({ error: 'Missing credential payload in request body' });
        return;
      }

      const result = await CredentialService.verifyCredential(credential);
      res.json(result);
    } catch (error: any) {
      console.error('VC verification error:', error);
      res.status(500).json({ error: 'Failed to verify credential' });
    }
  }

  /**
   * POST /api/credentials/:id/revoke
   * Revoke a credential with audit trail
   */
  public static async revoke(req: Request, res: Response): Promise<void> {
    try {
      const actorWallet = (req as any).user.address;
      const id = String(req.params.id);
      const { reason } = req.body;

      const record = await prisma.verifiableCredential.findFirst({
        where: {
          OR: [
            { id: id },
            { credentialId: id }
          ]
        }
      });

      if (!record) {
        res.status(404).json({ error: 'Credential not found' });
        return;
      }

      const updated = await CredentialService.revokeCredential(
        record.credentialId,
        reason || 'Revoked by Security Administrator',
        actorWallet
      );

      res.json({
        success: true,
        message: 'Credential successfully revoked',
        credentialId: updated.credentialId,
        status: updated.status
      });
    } catch (error: any) {
      console.error('Credential revocation error:', error);
      res.status(500).json({ error: error.message || 'Failed to revoke credential' });
    }
  }

  /**
   * GET /api/did/resolve/:did
   * Resolve a DID into a W3C DID Document
   */
  public static async resolveDid(req: Request, res: Response): Promise<void> {
    try {
      const did = String(req.params.did);
      const identity = await prisma.identity.findUnique({
        where: { did },
        include: { roles: true }
      });

      if (!identity) {
        res.status(404).json({ error: `DID ${did} not found in SecureChain registry` });
        return;
      }

      const didDocument = CredentialService.generateDidDocument(identity.did, identity.walletAddress);

      res.json({
        didDocument,
        didDocumentMetadata: {
          registeredAt: identity.registeredAt,
          isVerified: identity.isVerified,
          isRevoked: identity.isRevoked,
          isQuarantined: identity.isQuarantined,
          didDocumentHash: identity.didDocumentHash,
          roles: (identity as any).roles?.map((r: any) => r.role) || []
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to resolve DID' });
    }
  }

  /**
   * GET /api/pqc/info
   * Public info about BEL Authority Post-Quantum Cryptography parameters
   */
  public static async getPqcInfo(req: Request, res: Response): Promise<void> {
    try {
      const info = PqcService.getAuthorityPublicKey();
      res.json({
        postQuantumAuthority: {
          issuer: 'did:securechain:bel-authority',
          ...info,
          supportedSchemes: ['ML-DSA-65 (Primary)', 'ML-DSA-44 (Compact)', 'ECDSA Secp256k1 (Classical Hybrid)']
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get PQC information' });
    }
  }
}
