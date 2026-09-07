import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

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

// Ensure BEL Authority PQC Seed is strictly configured in environment
const rawSeed = process.env.BEL_PQC_SEED;
if (!rawSeed) {
  throw new Error('FATAL SECURITY CONFIGURATION ERROR: BEL_PQC_SEED is required in environment variables.');
}

const BEL_AUTHORITY_SEED = crypto
  .createHash('sha256')
  .update(rawSeed)
  .digest();

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
   * Generate a new PQC ML-DSA keypair for a subject or device
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
   * Derive a deterministic subject PQC keypair from subject wallet/entropy
   */
  public static deriveSubjectPqcPublicKey(subjectWallet: string): string {
    const subjectSeed = crypto
      .createHash('sha256')
      .update(`SUBJECT_PQC_KEY_${subjectWallet.toLowerCase()}_${rawSeed}`)
      .digest();
    const seedArray = new Uint8Array(32);
    seedArray.set(subjectSeed.subarray(0, 32));
    const subjectKeys = ml_dsa65.keygen(seedArray);
    return Buffer.from(subjectKeys.publicKey).toString('hex');
  }

  /**
   * Sign a payload with the BEL Authority ML-DSA private key
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
   * Deterministic Recursive RFC 8785 JSON Canonicalization Scheme (JCS)
   * Deeply sorts all object keys, preserves arrays, and serializes primitives deterministically.
   */
  public static canonicalize(data: any): string {
    if (data === null || typeof data !== 'object') {
      return JSON.stringify(data);
    }

    if (Array.isArray(data)) {
      const canonicalElements = data.map(item => this.canonicalize(item));
      return `[${canonicalElements.join(',')}]`;
    }

    const sortedKeys = Object.keys(data).sort();
    const keyValPairs = sortedKeys.map(key => {
      const value = data[key];
      // Skip undefined fields to match JSON serialization
      if (value === undefined) return null;
      return `${JSON.stringify(key)}:${this.canonicalize(value)}`;
    }).filter(Boolean);

    return `{${keyValPairs.join(',')}}`;
  }

  /**
   * Compute deterministic SHA-256 hash of canonicalized JSON payload
   */
  public static canonicalHash(data: any): string {
    const canonicalString = this.canonicalize(data);
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }
}
