'use client';

import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { ShieldCheck, Loader2, LogOut, KeyRound, Wallet } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
        toast.loading('Initiating cryptographic SIWE authentication...', { id: 'siwe-auth' });
        
        try {
          // 1. Fetch nonce from backend
          const nonceRes = await fetch('http://localhost:3001/api/auth/nonce');
          if (!nonceRes.ok) throw new Error('Could not connect to authentication backend (port 3001)');
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
             const errorData = await verifyRes.json().catch(() => ({}));
             throw new Error(errorData.error || 'Authentication signature verification failed');
          }
          
          const { token } = await verifyRes.json();
          
          // 4. Store token
          localStorage.setItem('auth_token', token);
          toast.success('Zero-Trust Identity Authenticated!', { id: 'siwe-auth' });
          
          // Redirect to dashboard
          router.push('/dashboard');
        } catch (error: any) {
          console.error("Signature verification failed:", error);
          toast.error(error.message || "Failed to authenticate with backend.", { id: 'siwe-auth' });
          
          if (error.message?.includes('Failed to fetch') || error.message?.includes('port 3001')) {
            toast.info("Ensure the backend service is running on http://localhost:3001");
          }
        }
      }
    } catch (error) {
      console.error("Auth failed:", error);
      toast.dismiss('siwe-auth');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isConnected) {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-muted bg-card text-foreground text-xs font-mono font-medium shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
        <button 
          onClick={handleConnect}
          disabled={isAuthenticating}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
        >
          {isAuthenticating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {isAuthenticating ? "Authenticating..." : "Authenticate Identity (SIWE)"}
        </button>
        <button 
          onClick={() => {
            disconnect();
            toast.info('Wallet disconnected');
          }} 
          className="p-2.5 rounded-xl border border-muted hover:border-red-500/40 text-muted-foreground hover:text-red-500 transition-colors text-xs bg-card"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleInitialConnect}
      disabled={isPending}
      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center gap-2.5 shadow-sm hover:bg-primary/90 transition-all"
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      Connect Secure Wallet
    </motion.button>
  );
}
