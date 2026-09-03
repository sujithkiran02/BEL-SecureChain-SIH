import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

async function main() {
  console.log("Starting deployment...");

  // Connect directly to local node using Account #0 Private Key
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

  let currentNonce = await provider.getTransactionCount(wallet.address);

  // Deploy AuditLog
  const auditLogArtifact = require("../artifacts/contracts/AuditLog.sol/AuditLog.json");
  const AuditLogFactory = new ethers.ContractFactory(auditLogArtifact.abi, auditLogArtifact.bytecode, wallet);
  const auditLog = await AuditLogFactory.deploy({ nonce: currentNonce++ });
  await auditLog.waitForDeployment();
  console.log("AuditLog deployed to:", auditLog.target);

  // Deploy AccessControlManager
  const accessControlArtifact = require("../artifacts/contracts/AccessControlManager.sol/AccessControlManager.json");
  const AccessControlFactory = new ethers.ContractFactory(accessControlArtifact.abi, accessControlArtifact.bytecode, wallet);
  const accessControl = await AccessControlFactory.deploy(auditLog.target, { nonce: currentNonce++ });
  await accessControl.waitForDeployment();
  console.log("AccessControlManager deployed to:", accessControl.target);

  // Deploy IdentityRegistry
  const identityRegistryArtifact = require("../artifacts/contracts/IdentityRegistry.sol/IdentityRegistry.json");
  const IdentityRegistryFactory = new ethers.ContractFactory(identityRegistryArtifact.abi, identityRegistryArtifact.bytecode, wallet);
  const identityRegistry = await IdentityRegistryFactory.deploy(accessControl.target, auditLog.target, { nonce: currentNonce++ });
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed to:", identityRegistry.target);

  // Deploy AssetNFT
  const assetNFTArtifact = require("../artifacts/contracts/AssetNFT.sol/AssetNFT.json");
  const AssetNFTFactory = new ethers.ContractFactory(assetNFTArtifact.abi, assetNFTArtifact.bytecode, wallet);
  const assetNFT = await AssetNFTFactory.deploy(accessControl.target, auditLog.target, identityRegistry.target, { nonce: currentNonce++ });
  await assetNFT.waitForDeployment();
  console.log("AssetNFT deployed to:", assetNFT.target);

  // Link contracts
  // Note: we just use standard ethers contract instances now
  const acmContract = new ethers.Contract(accessControl.target as string, accessControlArtifact.abi, wallet);
  const alContract = new ethers.Contract(auditLog.target as string, auditLogArtifact.abi, wallet);

  await (await acmContract.getFunction("setIdentityRegistry")(identityRegistry.target, { nonce: currentNonce++ })).wait();
  
  // Authorize contracts to log events
  await (await alContract.getFunction("setAuthorizedContract")(accessControl.target, true, { nonce: currentNonce++ })).wait();
  await (await alContract.getFunction("setAuthorizedContract")(identityRegistry.target, true, { nonce: currentNonce++ })).wait();
  await (await alContract.getFunction("setAuthorizedContract")(assetNFT.target, true, { nonce: currentNonce++ })).wait();
  console.log("Contracts linked and authorized.");

  // Save deployment addresses
  const deployData = {
    AuditLog: auditLog.target,
    AccessControlManager: accessControl.target,
    IdentityRegistry: identityRegistry.target,
    AssetNFT: assetNFT.target,
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deployData, null, 2)
  );
  console.log("Deployment addresses saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
