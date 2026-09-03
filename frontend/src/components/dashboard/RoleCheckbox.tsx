'use client';

import { useReadContract } from 'wagmi';
import { keccak256, toHex } from 'viem';
import { CONTRACT_ADDRESSES, AccessControlManagerABI } from '@/lib/web3/contracts';
import { useTrustChain } from '@/hooks/useTrustChain';
import { CheckSquare } from 'lucide-react';

export function RoleCheckbox({ role, action }: { role: string; action: string }) {
  const { setPermission } = useTrustChain();
  
  let actionConstant = '';
  if (action === 'Create') actionConstant = 'MINT_ASSET';
  if (action === 'Assign') actionConstant = 'TRANSFER_ASSET';
  if (action === 'View') actionConstant = 'VIEW_ASSET';
  if (action === 'Req') actionConstant = 'REQUEST_ACCESS';

  const roleConstant = `${role}_ROLE`;
  
  const roleHash = keccak256(toHex(roleConstant));
  const actionHash = keccak256(toHex(actionConstant));

  const { data: isAllowed } = useReadContract({
    address: CONTRACT_ADDRESSES.AccessControlManager as `0x${string}`,
    abi: AccessControlManagerABI,
    functionName: 'rolePermissions',
    args: [roleHash, actionHash],
    query: {
      refetchInterval: 2000, // Poll every 2 seconds to auto-update the UI when the block mines!
    }
  });

  const handleToggle = () => {
    // Fire the transaction to the blockchain
    setPermission(roleConstant, actionConstant, !isAllowed);
  };

  return (
    <CheckSquare 
      onClick={handleToggle} 
      className={`w-4 h-4 inline cursor-pointer transition-transform hover:scale-110 ${
        isAllowed ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'text-muted-foreground/30 hover:text-muted-foreground/80'
      }`} 
    />
  );
}
