import { ethers } from 'ethers';
import { RPC_URL, AUDIT_LOG_ADDRESS } from '../config';
import prisma from '../db';

// ABI for the AuditLog contract's EventLogged event
const AUDIT_LOG_ABI = [
  "event EventLogged(uint256 indexed id, string actionType, address indexed actor, uint256 timestamp)"
];

export const startListener = () => {
  if (!AUDIT_LOG_ADDRESS) {
    console.warn("No AUDIT_LOG_ADDRESS provided. Listener not started.");
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(AUDIT_LOG_ADDRESS, AUDIT_LOG_ABI, provider);

  console.log(`Listening for events on AuditLog at ${AUDIT_LOG_ADDRESS}...`);

  contract.on("EventLogged", async (id, actionType, actor, timestamp, event) => {
    try {
      console.log(`New event received: ${actionType} by ${actor}`);
      
      // In a real app, you would fetch the full entry details using contract.getEntry(id)
      // Here we just insert the basic event log into the DB index.
      const entryId = Number(id);
      
      await prisma.auditEntry.upsert({
        where: { id: entryId },
        update: {},
        create: {
          id: entryId,
          actionType,
          actorWallet: actor.toLowerCase(),
          details: "Indexed from event",
          timestamp: new Date(Number(timestamp) * 1000),
          blockNumber: event.log.blockNumber
        }
      });
      
    } catch (error) {
      console.error("Failed to index event:", error);
    }
  });
};
