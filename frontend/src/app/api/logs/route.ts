import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { CONTRACT_ADDRESSES, AuditLogABI } from '@/lib/web3/contracts';

// Configure the viem client to read from our local Hardhat node
const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545')
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get the total number of entries in the smart contract
    const totalEntries = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.AuditLog as `0x${string}`,
      abi: AuditLogABI,
      functionName: 'getTotalEntries'
    });

    const total = Number(totalEntries);
    const logs = [];

    // 2. We'll fetch the last 50 logs max to keep the dashboard snappy
    // Since IDs are 0-indexed (0 to total-1), the max ID is total - 1
    const startId = Math.max(0, total - 50);

    for (let i = total - 1; i >= startId; i--) {
      // 3. Fetch each log entry by its ID
      const entry = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.AuditLog as `0x${string}`,
        abi: AuditLogABI,
        functionName: 'getEntry',
        args: [BigInt(i)]
      });

      // 4. Map the Solidity Struct to our Frontend Interface
      logs.push({
        id: entry.id.toString(), // The smart contract entry ID as string
        action: entry.actionType,
        subject: entry.actor, // Who did the action
        resource: entry.details, // Details (like URI or Role)
        timestamp: new Date(Number(entry.timestamp) * 1000).toISOString(),
        status: 'SUCCESS' // All logged entries are successful executions on-chain
      });
    }

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching logs from blockchain:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs from the blockchain', details: error.message },
      { status: 500 }
    );
  }
}
