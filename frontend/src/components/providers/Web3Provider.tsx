'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http, useConnect } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected, mock } from 'wagmi/connectors';
import { useEffect } from 'react';

const config = createConfig({
  chains: [hardhat],
  connectors: [
    injected(),
    mock({
      accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'], // Hardhat Account #0
    }),
  ],
  transports: {
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

const queryClient = new QueryClient();

function AutoConnect({ children }: { children: React.ReactNode }) {
  const { connect, connectors } = useConnect();
  
  useEffect(() => {
    // Automatically connect the mock wallet (Account #0) for demo purposes
    const mockConnector = connectors.find(c => c.id === 'mock');
    if (mockConnector) {
      connect({ connector: mockConnector });
    }
  }, [connect, connectors]);

  return <>{children}</>;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect>
          {children}
        </AutoConnect>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
