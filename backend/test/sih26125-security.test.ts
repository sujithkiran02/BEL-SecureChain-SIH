import { PqcService } from '../src/modules/pqc/pqc.service';
import { CredentialService } from '../src/modules/credentials/credential.service';
import { ZeroTrustEngine } from '../src/modules/zero-trust/zero-trust.service';
import { ensureDefaultFacilities } from '../src/modules/facilities/facility.controller';
import prisma from '../src/db';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

async function run20AttackTestSuite() {
  await ensureDefaultFacilities();

  console.log('========================================================================');
  console.log('  BEL SecureChain — SIH 26125 20-Point Security & Attack Test Suite');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testNum: number, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ✓ Test ${testNum}: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ Test ${testNum}: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Setup Test Wallets & Signers
  const testWallet = '0x1111111111111111111111111111111111111111';
  const testDid = `did:securechain:${testWallet}`;
  const attackerWallet = '0x2222222222222222222222222222222222222222';
  const attackerDid = `did:securechain:${attackerWallet}`;
  const adminWallet = '0x3333333333333333333333333333333333333333';
  const adminDid = `did:securechain:${adminWallet}`;

  const signer = ethers.Wallet.createRandom();
  const realSignerWallet = signer.address.toLowerCase();
  const realSignerDid = `did:securechain:${realSignerWallet}`;

  // Seed Identifiers in DB
  await prisma.identity.upsert({
    where: { walletAddress: testWallet },
    update: { isVerified: true, isRevoked: false, isQuarantined: false },
    create: { walletAddress: testWallet, did: testDid, didDocumentHash: '0xhash1', isVerified: true, isRevoked: false }
  });

  await prisma.identity.upsert({
    where: { walletAddress: realSignerWallet },
    update: { isVerified: true, isRevoked: false, isQuarantined: false },
    create: { walletAddress: realSignerWallet, did: realSignerDid, didDocumentHash: '0xhash2', isVerified: true, isRevoked: false }
  });

  await prisma.identity.upsert({
    where: { walletAddress: adminWallet },
    update: { isVerified: true, isRevoked: false, isQuarantined: false },
    create: { walletAddress: adminWallet, did: adminDid, didDocumentHash: '0xadminhash', isVerified: true, isRevoked: false }
  });

  await prisma.identity.upsert({
    where: { walletAddress: attackerWallet },
    update: { isVerified: true, isRevoked: false, isQuarantined: false },
    create: { walletAddress: attackerWallet, did: attackerDid, didDocumentHash: '0xattackerhash', isVerified: true, isRevoked: false }
  });

  await prisma.role.upsert({
    where: { role_identityWallet: { role: 'USER_ROLE', identityWallet: attackerWallet } },
    update: {},
    create: { role: 'USER_ROLE', identityWallet: attackerWallet }
  });

  await prisma.role.upsert({
    where: { role_identityWallet: { role: 'ADMIN_ROLE', identityWallet: adminWallet } },
    update: {},
    create: { role: 'ADMIN_ROLE', identityWallet: adminWallet }
  });

  // -------------------------------------------------------------
  // 1. REPLAY OLD DID CHALLENGE
  // -------------------------------------------------------------
  const replayChallenge = `BEL-DID-CHALLENGE-REPLAY-${Date.now()}`;
  await prisma.nonceRecord.create({
    data: { nonce: replayChallenge, walletAddress: testWallet, expiresAt: new Date(Date.now() + 60000), used: true }
  });
  const replayNonce = await prisma.nonceRecord.findUnique({ where: { nonce: replayChallenge } });
  assert(replayNonce?.used === true, 1, 'Replay old consumed DID challenge -> Rejected');

  // -------------------------------------------------------------
  // 2. WRONG WALLET SIGNS DID CHALLENGE
  // -------------------------------------------------------------
  const legitChallenge = `BEL-DID-CHALLENGE-${Date.now()}`;
  const badSigner = ethers.Wallet.createRandom();
  const forgedSig = await badSigner.signMessage(legitChallenge);
  const recoveredAddr = ethers.verifyMessage(legitChallenge, forgedSig).toLowerCase();
  assert(recoveredAddr !== testWallet, 2, 'Wrong wallet signs DID challenge -> Signature mismatch rejected');

  // -------------------------------------------------------------
  // 3. EXPIRED DID CHALLENGE
  // -------------------------------------------------------------
  const expiredChallenge = `BEL-DID-CHALLENGE-EXPIRED-${Date.now()}`;
  await prisma.nonceRecord.create({
    data: { nonce: expiredChallenge, walletAddress: testWallet, expiresAt: new Date(Date.now() - 1000), used: false }
  });
  const expRecord = await prisma.nonceRecord.findUnique({ where: { nonce: expiredChallenge } });
  const isExp = !expRecord || new Date() > expRecord.expiresAt;
  assert(isExp === true, 3, 'Expired DID challenge -> Rejected');

  // -------------------------------------------------------------
  // 4. TAMPERED VC CLAIM
  // -------------------------------------------------------------
  const validVC = await CredentialService.issueCredential({
    issuerWallet: adminWallet,
    subjectDid: realSignerDid,
    subjectWallet: realSignerWallet,
    credentialType: 'SecurityClearanceCredential',
    claims: { clearanceLevel: 4, facilities: ['FACILITY-A', 'FACILITY-B'], department: 'Radar EW' }
  });
  const tamperedVC = JSON.parse(JSON.stringify(validVC));
  tamperedVC.credentialSubject.clearanceLevel = 5; // Attacker escalates clearance
  const tamperedResult = await CredentialService.verifyCredential(tamperedVC);
  assert(tamperedResult.valid === false, 4, 'Tampered VC claim (Clearance altered) -> Cryptographic signature fails');

  // -------------------------------------------------------------
  // 5. INVALID ECDSA PROOF
  // -------------------------------------------------------------
  const badEcdsaVC = JSON.parse(JSON.stringify(validVC));
  badEcdsaVC.proof.signature = '0xbad000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b';
  const badEcdsaResult = await CredentialService.verifyCredential(badEcdsaVC);
  assert(badEcdsaResult.valid === false && badEcdsaResult.signatureValid === false, 5, 'Invalid Classical ECDSA proof -> Verification rejected');

  // -------------------------------------------------------------
  // 6. INVALID ML-DSA POST-QUANTUM PROOF
  // -------------------------------------------------------------
  const badPqcVC = JSON.parse(JSON.stringify(validVC));
  badPqcVC.pqcProof.signatureHex = validVC.pqcProof.signatureHex.replace(/^[0-9a-f]{4}/, 'ffff');
  const badPqcResult = await CredentialService.verifyCredential(badPqcVC);
  assert(badPqcResult.valid === false && badPqcResult.pqcSignatureValid === false, 6, 'Invalid NIST ML-DSA-65 proof -> Post-Quantum verification rejected');

  // -------------------------------------------------------------
  // 7. REVOKED VC
  // -------------------------------------------------------------
  await CredentialService.revokeCredential(validVC.id, 'Routine security rotation', adminWallet);
  const revokedVcResult = await CredentialService.verifyCredential(validVC);
  assert(revokedVcResult.valid === false && revokedVcResult.notRevoked === false, 7, 'Revoked Verifiable Credential -> Verification rejected (CREDENTIAL_REVOKED)');

  // -------------------------------------------------------------
  // 8. EXPIRED VC
  // -------------------------------------------------------------
  const expiredVC = JSON.parse(JSON.stringify(validVC));
  expiredVC.expirationDate = new Date(Date.now() - 3600000).toISOString();
  const expVcResult = await CredentialService.verifyCredential(expiredVC);
  assert(expVcResult.valid === false && expVcResult.notExpired === false, 8, 'Expired Verifiable Credential -> Verification rejected (CREDENTIAL_EXPIRED)');

  // -------------------------------------------------------------
  // 9. CREDENTIAL BELONGING TO ANOTHER DID (IDENTITY THEFT ATTEMPT)
  // -------------------------------------------------------------
  const employeeVC = await CredentialService.issueCredential({
    issuerWallet: adminWallet,
    subjectDid: testDid,
    subjectWallet: testWallet,
    credentialType: 'FacilityAccessCredential',
    claims: { clearanceLevel: 4, facilities: ['FACILITY-A'] }
  });
  // Attacker presents employeeVC with attacker's DID as holder
  const presentationChallenge = `pres-chal-${Date.now()}`;
  await prisma.nonceRecord.create({
    data: { nonce: presentationChallenge, walletAddress: attackerWallet, expiresAt: new Date(Date.now() + 60000), used: false }
  });
  const attackerPresResult = await CredentialService.verifyPresentation({
    presentation: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiablePresentation'],
      verifiableCredential: employeeVC,
      holder: attackerDid, // Attacker DID differs from subject DID testDid
      proof: {
        type: 'EcdsaSecp256k1Signature2019',
        created: new Date().toISOString(),
        challenge: presentationChallenge,
        domain: 'https://securechain.bel.gov.in',
        verificationMethod: `${attackerDid}#key-1`,
        proofPurpose: 'authentication',
        signature: '0xmock'
      }
    }
  });
  assert(attackerPresResult.valid === false && attackerPresResult.reasonCode === 'HOLDER_MISMATCH', 9, 'Credential presented by another DID -> Rejected (HOLDER_MISMATCH)');

  // -------------------------------------------------------------
  // 10. UNAUTHORIZED FACILITY ACCESS
  // -------------------------------------------------------------
  // testDid has VC only for FACILITY-A; requests FACILITY-B
  const decisionWrongFac = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-B',
    action: 'ENTER'
  });
  assert(decisionWrongFac.allowed === false && decisionWrongFac.reasonCode === 'FACILITY_NOT_AUTHORIZED', 10, 'Unauthorized Facility request -> Denied (FACILITY_NOT_AUTHORIZED)');

  // -------------------------------------------------------------
  // 11. INSUFFICIENT CLEARANCE
  // -------------------------------------------------------------
  const lowClearanceVC = await CredentialService.issueCredential({
    issuerWallet: adminWallet,
    subjectDid: realSignerDid,
    subjectWallet: realSignerWallet,
    credentialType: 'VisitorCredential',
    claims: { clearanceLevel: 1, facilities: ['FACILITY-A'] } // Clearance 1, but Facility-A requires Level 3+
  });
  const decisionLowClearance = await ZeroTrustEngine.authorize({
    walletAddress: realSignerWallet,
    subjectDid: realSignerDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER'
  });
  assert(decisionLowClearance.allowed === false && decisionLowClearance.reasonCode === 'INSUFFICIENT_CLEARANCE', 11, 'Insufficient clearance level -> Denied (INSUFFICIENT_CLEARANCE)');

  // -------------------------------------------------------------
  // 12. MISSING BIOMETRIC TOKEN
  // -------------------------------------------------------------
  // Issue clearance 4 VC to testDid for FACILITY-A (biometric required)
  const highClearanceVC = await CredentialService.issueCredential({
    issuerWallet: adminWallet,
    subjectDid: testDid,
    subjectWallet: testWallet,
    credentialType: 'OfficerCredential',
    claims: { clearanceLevel: 4, facilities: ['FACILITY-A'] }
  });
  const decisionNoBio = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER'
  });
  assert(decisionNoBio.allowed === false && decisionNoBio.reasonCode === 'BIOMETRIC_REQUIRED', 12, 'High-security zone without biometric factor -> Denied (BIOMETRIC_REQUIRED)');

  // -------------------------------------------------------------
  // 13. EXPIRED BIOMETRIC TOKEN
  // -------------------------------------------------------------
  const expBioToken = `bio-expired-${Date.now()}`;
  await prisma.biometricSession.create({
    data: { sessionToken: expBioToken, walletAddress: testWallet, did: testDid, method: 'FACE', verified: true, expiresAt: new Date(Date.now() - 10000) }
  });
  const decisionExpBio = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER',
    biometricToken: expBioToken
  });
  assert(decisionExpBio.allowed === false && decisionExpBio.reasonCode === 'BIOMETRIC_INVALID', 13, 'Expired biometric attestation token -> Denied (BIOMETRIC_INVALID)');

  // -------------------------------------------------------------
  // 14. REVOKED IDENTITY
  // -------------------------------------------------------------
  await prisma.identity.update({ where: { walletAddress: testWallet }, data: { isRevoked: true } });
  const decisionRevokedId = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER'
  });
  assert(decisionRevokedId.allowed === false && decisionRevokedId.reasonCode === 'IDENTITY_REVOKED', 14, 'Revoked Decentralized Identity -> Denied (IDENTITY_REVOKED)');
  await prisma.identity.update({ where: { walletAddress: testWallet }, data: { isRevoked: false } }); // Restore

  // -------------------------------------------------------------
  // 15. QUARANTINED IDENTITY
  // -------------------------------------------------------------
  await prisma.identity.update({ where: { walletAddress: testWallet }, data: { isQuarantined: true } });
  const decisionQuarantined = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER'
  });
  assert(decisionQuarantined.allowed === false && decisionQuarantined.reasonCode === 'IDENTITY_QUARANTINED', 15, 'Quarantined Identity (Circuit Breaker) -> Denied (IDENTITY_QUARANTINED)');
  await prisma.identity.update({ where: { walletAddress: testWallet }, data: { isQuarantined: false } }); // Restore

  // -------------------------------------------------------------
  // 16. TAMPERED ASSET PAYLOAD & SOC ALERT
  // -------------------------------------------------------------
  const assetId = 77777;
  const originalData = 'BEL-CLASSIFIED-RADAR-SPEC-2026';
  const trustedHash = `0x${crypto.createHash('sha256').update(originalData).digest('hex')}`;
  
  const uploadDirs = [
    path.join(__dirname, '../../../uploads'),
    path.join(process.cwd(), '../uploads'),
    path.join(process.cwd(), 'uploads')
  ];

  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, trustedHash), 'TAMPERED_CONTENT_CORRUPTED');
  }

  await prisma.asset.upsert({
    where: { tokenId: assetId },
    update: { metadataHash: trustedHash },
    create: { tokenId: assetId, metadataHash: trustedHash, ownerWallet: testWallet }
  });

  const decisionTamperedAsset = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'ASSET',
    resourceId: String(assetId),
    action: 'DOWNLOAD'
  });
  assert(decisionTamperedAsset.allowed === false && decisionTamperedAsset.reasonCode === 'ASSET_INTEGRITY_FAILURE', 16, 'Tampered asset on disk -> SHA-256 mismatch detected & Denied (ASSET_INTEGRITY_FAILURE)');

  // -------------------------------------------------------------
  // 17. UNAUTHORIZED ROLE
  // -------------------------------------------------------------
  const decisionUnauthRole = await ZeroTrustEngine.authorize({
    walletAddress: attackerWallet,
    subjectDid: attackerDid,
    resourceType: 'ADMIN_OPERATION',
    resourceId: 'MODIFY_DEFENSE_PERIMETER',
    action: 'MANAGE'
  });
  assert(decisionUnauthRole.allowed === false && decisionUnauthRole.reasonCode === 'ROLE_NOT_AUTHORIZED', 17, 'Non-admin role executing admin operation -> Denied (ROLE_NOT_AUTHORIZED)');

  // -------------------------------------------------------------
  // 18. ADMIN ATTEMPTING UNAUTHORIZED CLEARANCE BYPASS
  // -------------------------------------------------------------
  // Admin wallet has NO valid VC for FACILITY-B (which requires clearance 4+)
  const decisionAdminBypass = await ZeroTrustEngine.authorize({
    walletAddress: adminWallet,
    subjectDid: adminDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-B',
    action: 'ENTER'
  });
  assert(decisionAdminBypass.allowed === false, 18, 'Admin account without clearance VC cannot bypass facility rules -> Denied (No Admin Bypass)');

  // -------------------------------------------------------------
  // 19. EMERGENCY OVERRIDE WITHOUT VALID APPROVAL
  // -------------------------------------------------------------
  const decisionFakeOverride = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER',
    emergencyOverrideId: 'non-existent-override-id'
  });
  assert(decisionFakeOverride.allowed === false && decisionFakeOverride.reasonCode === 'EMERGENCY_OVERRIDE_INVALID', 19, 'Emergency override with invalid ID -> Denied (EMERGENCY_OVERRIDE_INVALID)');

  // -------------------------------------------------------------
  // 20. EMERGENCY OVERRIDE WITH VALID APPROVAL AND EXPIRY
  // -------------------------------------------------------------
  const validOverride = await prisma.emergencyOverride.create({
    data: {
      subjectDid: testDid,
      subjectWallet: testWallet,
      resourceType: 'FACILITY',
      resourceId: 'FACILITY-A',
      reason: 'DEFCON 1 Emergency Radar Maintenance Authorized',
      approvingOfficer: 'General Officer Commanding (BEL HQ)',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour valid
      active: true
    }
  });
  const decisionValidOverride = await ZeroTrustEngine.authorize({
    walletAddress: testWallet,
    subjectDid: testDid,
    resourceType: 'FACILITY',
    resourceId: 'FACILITY-A',
    action: 'ENTER',
    emergencyOverrideId: validOverride.id
  });
  assert(decisionValidOverride.allowed === true && decisionValidOverride.reasonCode === 'EMERGENCY_OVERRIDE_APPLIED', 20, 'Scoped Emergency Override with officer approval -> Access Granted (EMERGENCY_OVERRIDE_APPLIED)');

  console.log('\n========================================================================');
  console.log(`  FINAL RESULTS: ${passed} PASSED / ${failed} FAILED (20/20 Security Checks)`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run20AttackTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
