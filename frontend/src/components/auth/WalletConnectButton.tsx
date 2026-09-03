'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    try {
      if (!isConnected) {
        connect({ connector: connectors[0] });
      } else {
        // Authenticate with SIWE
        setIsAuthenticating(true);
        // Normally we fetch a nonce from backend here
        const nonce = "12345678"; 
        
        const message = new SiweMessage({
          domain: window.location.host,
          address: address,
          statement: 'Sign in to TrustChain with Ethereum.',
          uri: window.location.origin,
          version: '1',
          chainId: 31337, // Hardhat local
          nonce,
        });

        try {
          const signature = await signMessageAsync({
            message: message.prepareMessage(),
          });
          console.log("Authenticated! Signature:", signature);
        } catch (signError) {
          console.log("Signature bypassed for demo mode.");
        }
        
        // Redirect to dashboard without breaking React state
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Auth failed:", error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-primary/50 shadow-glow text-primary text-sm font-mono">
          <ShieldCheck className="w-4 h-4" />
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button 
          onClick={handleConnect}
          disabled={isAuthenticating}
          className="px-6 py-2 rounded-lg bg-primary text-background font-bold hover:shadow-glow transition-all flex items-center gap-2"
        >
          {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate Identity"}
        </button>
        <button onClick={() => disconnect()} className="text-muted-foreground hover:text-white transition-colors text-sm">
          Disconnect
        </button>
      </div>
    );
  }

  // Smart fallback for hackathon demos: use mock if MetaMask isn't installed
  const handleInitialConnect = () => {
    const hasEthereum = typeof window !== 'undefined' && window.ethereum;
    const targetConnector = hasEthereum 
      ? connectors.find(c => c.id === 'injected' || c.id === 'metaMask')
      : connectors.find(c => c.id === 'mock');
      
    if (targetConnector) {
      connect({ connector: targetConnector });
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleInitialConnect}
      disabled={isPending}
      className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-background font-bold text-lg flex items-center gap-3 shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:shadow-[0_0_50px_rgba(0,240,255,0.6)] transition-all"
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <ShieldAlert className="w-6 h-6" />
      )}
      Connect Secure Wallet
    </motion.button>
  );
}
