import { expect } from "chai";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ethers";
// @ts-ignore: Hardhat ethers plugin augmentation is not picking up in this TS setup
import { ethers } from "hardhat";

describe("TrustChain Core flow", function () {
  let auditLog: any;
  let accessControl: any;
  let identityRegistry: any;
  let assetNFT: any;
  let owner: any;
  let admin: any;
  let manager: any;
  let user1: any;
  let user2: any;

  before(async function () {
    [owner, admin, manager, user1, user2] = await ethers.getSigners();
  });

  it("Should deploy and link contracts correctly", async function () {
    const AuditLog = await ethers.getContractFactory("AuditLog");
    auditLog = await AuditLog.deploy();

    const AccessControlManager = await ethers.getContractFactory("AccessControlManager");
    accessControl = await AccessControlManager.deploy(auditLog.target);

    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy(accessControl.target, auditLog.target);

    const AssetNFT = await ethers.getContractFactory("AssetNFT");
    assetNFT = await AssetNFT.deploy(accessControl.target, auditLog.target, identityRegistry.target);

    // Link AccessControl to IdentityRegistry for checking active identities
    await accessControl.setIdentityRegistry(identityRegistry.target);

    // Authorize contracts on AuditLog
    await auditLog.setAuthorizedContract(accessControl.target, true);
    await auditLog.setAuthorizedContract(identityRegistry.target, true);
    await auditLog.setAuthorizedContract(assetNFT.target, true);

    expect(await accessControl.identityRegistry()).to.equal(identityRegistry.target);
  });

  it("Should register and verify an identity", async function () {
    await identityRegistry.connect(user1).registerIdentity("ipfs://hash123", "did:trustchain:user1");
    let id = await identityRegistry.getIdentity(user1.address);
    expect(id.isVerified).to.be.false;

    // Verify identity by admin
    await identityRegistry.connect(owner).verifyIdentity(user1.address);
    id = await identityRegistry.getIdentity(user1.address);
    expect(id.isVerified).to.be.true;
  });

  it("Should assign a role and allow minting if permitted", async function () {
    const MINT_ASSET = ethers.keccak256(ethers.toUtf8Bytes("MINT_ASSET"));
    
    // Set permission for MANAGER_ROLE to mint assets
    const MANAGER_ROLE = await accessControl.MANAGER_ROLE();
    await accessControl.setPermission(MANAGER_ROLE, MINT_ASSET, true);

    // Assign manager role to manager
    // Manager needs to register and be verified first
    await identityRegistry.connect(manager).registerIdentity("ipfs://manager1", "did:trustchain:manager");
    await identityRegistry.connect(owner).verifyIdentity(manager.address);
    
    await accessControl.assignRole(manager.address, MANAGER_ROLE);

    // Mint asset by manager to user1
    await assetNFT.connect(manager).mintAsset(user1.address, "ipfs://asset1");
    
    expect(await assetNFT.ownerOf(0)).to.equal(user1.address);
  });
});
