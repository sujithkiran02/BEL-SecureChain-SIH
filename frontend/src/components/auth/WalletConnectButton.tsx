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
        
        try {
          // 1. Fetch nonce from backend
          const nonceRes = await fetch('http://localhost:3001/api/auth/nonce');
          if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
          const { nonce } = await nonceRes.json();
          
          const message = new SiweMessage({
            domain: window.location.host,
            address: address,
            statement: 'Sign in to BEL SecureChain with Ethereum.',
            uri: window.location.origin,
            version: '1',
            chainId: 31337, // Hardhat local
            nonce,
          });

          // 2. Prompt wallet signature
          const signature = await signMessageAsync({
            message: message.prepareMessage(),
          });
          
          // 3. Verify on backend
          const verifyRes = await fetch('http://localhost:3001/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, signature }),
          });
          
          if (!verifyRes.ok) {
             const errorData = await verifyRes.json();
             throw new Error(errorData.error || 'Authentication failed');
          }
          
          const { token, identity } = await verifyRes.json();
          
          // 4. Store token
          localStorage.setItem('auth_token', token);
          
          console.log("Authenticated! Token saved.");
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error: any) {
          console.error("Signature verification failed:", error);
          alert(error.message || "Failed to authenticate with backend.");
        }
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
