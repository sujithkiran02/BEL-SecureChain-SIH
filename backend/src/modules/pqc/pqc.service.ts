import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import crypto from 'crypto';

export interface PqcKeyPair {
  publicKeyHex: string;
  secretKeyHex: string;
  algorithm: string;
  securityLevel: string;
}

export interface PqcSignatureResult {
  algorithm: 'ML-DSA-65';
  publicKeyHex: string;
  signatureHex: string;
  timestamp: string;
}

// Persistent deterministic Authority PQC Keypair for Bharat Electronics Limited (BEL)
const BEL_AUTHORITY_SEED = crypto
  .createHash('sha256')
  .update(process.env.BEL_PQC_SEED || 'BEL-SECURECHAIN-AUTHORITY-ROOT-SEED-2026-NIST-FIPS-204')
  .digest();

// Generate 32-byte seed for ML-DSA
const authoritySeedArray = new Uint8Array(32);
authoritySeedArray.set(BEL_AUTHORITY_SEED.subarray(0, 32));
const belAuthorityKeys = ml_dsa65.keygen(authoritySeedArray);

export class PqcService {
  /**
   * Get the public key of the BEL Post-Quantum Authority (ML-DSA-65)
   */
  public static getAuthorityPublicKey(): {
    publicKeyHex: string;
    algorithm: string;
    securityLevel: string;
    fipsStandard: string;
  } {
    return {
      publicKeyHex: Buffer.from(belAuthorityKeys.publicKey).toString('hex'),
      algorithm: 'ML-DSA-65',
      securityLevel: 'NIST Level 3 (192-bit Quantum Security)',
      fipsStandard: 'NIST FIPS 204 (August 2024)'
    };
  }

  /**
   * Generate a new PQC ML-DSA keypair for a user or device
   */
  public static generateKeyPair(): PqcKeyPair {
    const keys = ml_dsa65.keygen();
    return {
      publicKeyHex: Buffer.from(keys.publicKey).toString('hex'),
      secretKeyHex: Buffer.from(keys.secretKey).toString('hex'),
      algorithm: 'ML-DSA-65',
      securityLevel: 'NIST Level 3'
    };
  }

  /**
   * Sign a payload (string or Buffer) with the BEL Authority ML-DSA private key
   */
  public static signWithAuthority(payload: string | Buffer): PqcSignatureResult {
    const dataBytes = typeof payload === 'string' 
      ? new TextEncoder().encode(payload)
      : new Uint8Array(payload);

    const signatureBytes = ml_dsa65.sign(dataBytes, belAuthorityKeys.secretKey);

    return {
      algorithm: 'ML-DSA-65',
      publicKeyHex: Buffer.from(belAuthorityKeys.publicKey).toString('hex'),
      signatureHex: Buffer.from(signatureBytes).toString('hex'),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Sign arbitrary data with a user's ML-DSA private key
   */
  public static signWithPrivateKey(payload: string | Buffer, secretKeyHex: string): string {
    const dataBytes = typeof payload === 'string'
      ? new TextEncoder().encode(payload)
      : new Uint8Array(payload);

    const secretKeyBytes = new Uint8Array(Buffer.from(secretKeyHex, 'hex'));
    const signatureBytes = ml_dsa65.sign(dataBytes, secretKeyBytes);
    return Buffer.from(signatureBytes).toString('hex');
  }

  /**
   * Cryptographically verify an ML-DSA signature
   */
  public static verifySignature(
    payload: string | Buffer,
    signatureHex: string,
    publicKeyHex: string
  ): boolean {
    try {
      const dataBytes = typeof payload === 'string'
        ? new TextEncoder().encode(payload)
        : new Uint8Array(payload);

      const signatureBytes = new Uint8Array(Buffer.from(signatureHex, 'hex'));
      const publicKeyBytes = new Uint8Array(Buffer.from(publicKeyHex, 'hex'));

      return ml_dsa65.verify(signatureBytes, dataBytes, publicKeyBytes);
    } catch (error) {
      console.error('PQC ML-DSA verification error:', error);
      return false;
    }
  }

  /**
   * Deterministically hash any JSON object canonically (sorted keys) for signing
   */
  public static canonicalHash(data: any): string {
    const canonicalString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }
}
