import { ethers } from 'ethers';
import { RPC_URL, AUDIT_LOG_ADDRESS } from '../config';
import prisma from '../db';

// ABI for the AuditLog contract's EventLogged event
const AUDIT_LOG_ABI = [
  "event EventLogged(uint256 indexed id, string actionType, address indexed actor, uint256 timestamp)",
  "function getTotalEntries() external view returns (uint256)",
  "function getEntry(uint256 id) external view returns (tuple(uint256 id, string actionType, address actor, address relatedUser, uint256 relatedAssetId, string details, uint256 timestamp, uint256 blockNumber))"
];

export const startListener = async () => {
  if (!AUDIT_LOG_ADDRESS) {
    console.warn("No AUDIT_LOG_ADDRESS provided. Listener not started.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(AUDIT_LOG_ADDRESS, AUDIT_LOG_ABI, provider);

  // Sync historical events first
  try {
    console.log("Starting historical event sync...");
    const totalEntries = await contract.getTotalEntries();
    const total = Number(totalEntries);
    
    // Find the latest processed entry in our DB
    const latestEntry = await prisma.auditEntry.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const startIndex = latestEntry ? latestEntry.id + 1 : 0;
    
    if (startIndex < total) {
      console.log(`Syncing missing events from ID ${startIndex} to ${total - 1}...`);
      for (let i = startIndex; i < total; i++) {
        const fullEntry = await contract.getEntry(i);
        await processEvent(
          Number(fullEntry.id), 
          fullEntry.actionType, 
          fullEntry.actor, 
          Number(fullEntry.timestamp), 
          0, // blockNumber placeholder
          contract
        );
      }
      console.log("Historical sync complete.");
    } else {
      console.log("Database is already up to date with blockchain logs.");
    }
  } catch (error) {
    console.error("Error during historical sync:", error);
  }

  console.log(`Listening for new events on AuditLog at ${AUDIT_LOG_ADDRESS}...`);

  contract.on("EventLogged", async (id, actionType, actor, timestamp, event) => {
    // In ethers v6, event is an EventLog object which directly contains blockNumber
    const bNumber = event && event.blockNumber ? event.blockNumber : 0;
    await processEvent(Number(id), actionType, actor, Number(timestamp), bNumber, contract);
  });
};

async function processEvent(entryId: number, actionType: string, actor: string, timestamp: number, blockNumber: number, contract: ethers.Contract) {
  try {
    console.log(`Processing event ${entryId}: ${actionType} by ${actor}`);
      
      // Fetch full entry details from the contract
      const fullEntry = await contract.getEntry(entryId);
      
      const relatedUser = fullEntry.relatedUser.toLowerCase();
      const relatedAssetId = Number(fullEntry.relatedAssetId);
      const details = fullEntry.details;
      // blockNumber is already passed as a parameter to processEvent

      // Upsert Audit Log Entry
      await prisma.auditEntry.upsert({
        where: { id: entryId },
        update: {},
        create: {
          id: entryId,
          actionType,
          actorWallet: actor.toLowerCase(),
          relatedUser: relatedUser !== '0x0000000000000000000000000000000000000000' ? relatedUser : null,
          relatedAssetId: relatedAssetId !== 0 ? relatedAssetId : null,
          details,
          timestamp: new Date(Number(timestamp) * 1000),
          blockNumber
        }
      });

      // Synchronize Identity State
      if (actionType === "IDENTITY_REGISTERED") {
        await prisma.identity.upsert({
          where: { walletAddress: actor.toLowerCase() },
          update: { did: details },
          create: {
            walletAddress: actor.toLowerCase(),
            did: details,
            didDocumentHash: '',
            isVerified: false,
            isRevoked: false,
          }
        });
      } else if (actionType === "IDENTITY_VERIFIED") {
        await prisma.identity.update({
          where: { walletAddress: relatedUser },
          data: { isVerified: true }
        });
      } else if (actionType === "IDENTITY_REVOKED") {
        await prisma.identity.update({
          where: { walletAddress: relatedUser },
          data: { isRevoked: true, isVerified: false }
        });
      }
      
      // Synchronize Role State
      else if (actionType === "ROLE_ASSIGNED") {
        // details contains the role string (e.g., ADMIN_ROLE)
        const roleStr = details.split(' ')[0]; // Parse role if message is "ADMIN_ROLE assigned" etc
        const cleanRole = roleStr.replace(/assigned/i, '').trim();
        if (cleanRole) {
           await prisma.role.upsert({
             where: { role_identityWallet: { role: cleanRole, identityWallet: relatedUser } },
             update: {},
             create: { role: cleanRole, identityWallet: relatedUser }
           });
        }
      } else if (actionType === "ROLE_REVOKED") {
        const roleStr = details.split(' ')[0];
        const cleanRole = roleStr.replace(/revoked/i, '').trim();
        if (cleanRole) {
           await prisma.role.deleteMany({
             where: { role: cleanRole, identityWallet: relatedUser }
           });
        }
      }
      
      // Synchronize Asset State
      else if (actionType === "ASSET_MINTED") {
        await prisma.asset.upsert({
          where: { tokenId: relatedAssetId },
          update: {},
          create: {
            tokenId: relatedAssetId,
            metadataHash: details,
            ownerWallet: relatedUser,
            isRevoked: false
          }
        });
      } else if (actionType === "ASSET_REVOKED") {
        await prisma.asset.update({
          where: { tokenId: relatedAssetId },
          data: { isRevoked: true }
        });
      } else if (actionType === "ASSET_TRANSFERRED") {
        await prisma.asset.update({
          where: { tokenId: relatedAssetId },
          data: { ownerWallet: relatedUser }
        });
      }
      
      
    } catch (error) {
      console.error(`Failed to process event ${entryId}:`, error);
    }
}
