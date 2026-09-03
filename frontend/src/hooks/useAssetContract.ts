import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

const ASSET_NFT_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "string", name: "uri", type: "string" }
    ],
    name: "safeMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// In a real app, this comes from environment variables or deployment output.
// Replace with the actual deployed address of AssetNFT from Hardhat logs.
export const ASSET_NFT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Hardhat local address example

export function useAssetContract() {
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();

  const { isLoading: isWaiting, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  const mintAsset = (to: `0x${string}`, uri: string) => {
    writeContract({
      address: ASSET_NFT_ADDRESS as `0x${string}`,
      abi: ASSET_NFT_ABI,
      functionName: 'safeMint',
      args: [to, uri],
    });
  };

  return {
    mintAsset,
    isPending: isWriting || isWaiting,
    isSuccess,
    error: writeError || txError,
    hash
  };
}
