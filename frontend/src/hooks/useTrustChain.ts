import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES, AssetNFTABI, AccessControlManagerABI } from '@/lib/web3/contracts';
import { keccak256, toBytes, toHex } from 'viem';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function useTrustChain() {
  const { address } = useAccount();

  // Mint Asset Hook
  const { data: mintHash, isPending: isMintPending, writeContract: writeMint } = useWriteContract();
  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  useEffect(() => {
    if (isMintConfirming) toast.loading('Mining transaction on localhost...', { id: 'mint' });
    if (isMintSuccess) toast.success('Asset Minted successfully on blockchain!', { id: 'mint' });
  }, [isMintConfirming, isMintSuccess]);

  const mintAsset = (toAddress: string, metadataURI: string) => {
    writeMint({
      address: CONTRACT_ADDRESSES.AssetNFT as `0x${string}`,
      abi: AssetNFTABI,
      functionName: 'mintAsset',
      args: [toAddress as `0x${string}`, metadataURI],
    }, {
      onError: (error) => toast.error(`Mint Failed: ${error.message.split('\\n')[0]}`),
    });
  };

  // Role Assignment Hook
  const { data: roleHash, isPending: isRolePending, writeContract: writeRole } = useWriteContract();
  const { isLoading: isRoleConfirming, isSuccess: isRoleSuccess } = useWaitForTransactionReceipt({ hash: roleHash });

  useEffect(() => {
    if (isRoleConfirming) toast.loading('Mining transaction on localhost...', { id: 'role' });
    if (isRoleSuccess) toast.success('Role Assigned successfully on blockchain!', { id: 'role' });
  }, [isRoleConfirming, isRoleSuccess]);

  const grantRole = (roleHash: `0x${string}`, account: string) => {
    writeRole({
      address: CONTRACT_ADDRESSES.AccessControlManager as `0x${string}`,
      abi: AccessControlManagerABI,
      functionName: 'grantRole',
      args: [roleHash, account as `0x${string}`],
    }, {
      onError: (error) => toast.error(`Role Assignment Failed: ${error.message.split('\\n')[0]}`),
    });
  };

  // Permission Assignment Hook (Role Matrix)
  const { data: permHash, isPending: isPermPending, writeContract: writePerm } = useWriteContract();
  const { isLoading: isPermConfirming, isSuccess: isPermSuccess } = useWaitForTransactionReceipt({ hash: permHash });

  useEffect(() => {
    if (isPermConfirming) toast.loading('Mining transaction on localhost...', { id: 'perm' });
    if (isPermSuccess) toast.success('Permission updated successfully on blockchain!', { id: 'perm' });
  }, [isPermConfirming, isPermSuccess]);

  const setPermission = (roleString: string, actionString: string, allowed: boolean) => {
    // Convert string to bytes32 keccak256 hash
    const roleHash = keccak256(toHex(roleString));
    const actionHash = keccak256(toHex(actionString));
    
    writePerm({
      address: CONTRACT_ADDRESSES.AccessControlManager as `0x${string}`,
      abi: AccessControlManagerABI,
      functionName: 'setPermission',
      args: [roleHash, actionHash, allowed],
    }, {
      onError: (error) => toast.error(`Permission Update Failed: ${error.message.split('\\n')[0]}`),
    });
  };

  return {
    mintAsset,
    isMintPending: isMintPending || isMintConfirming,
    setPermission,
    isPermPending: isPermPending || isPermConfirming,
  };
}
