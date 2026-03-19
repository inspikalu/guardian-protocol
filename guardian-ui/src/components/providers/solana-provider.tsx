'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

type RpcOption = 'devnet' | 'helius';

interface RpcContextValue {
  rpcOption: RpcOption;
  setRpcOption: (next: RpcOption) => void;
  endpoint: string;
  heliusAvailable: boolean;
}

const RpcContext = createContext<RpcContextValue | null>(null);

const RPC_STORAGE_KEY = 'guardian-rpc-option';

export function useRpcEndpoint() {
  const ctx = useContext(RpcContext);
  if (!ctx) {
    throw new Error('useRpcEndpoint must be used within SolanaProvider');
  }
  return ctx;
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  const devnetEndpoint = useMemo(() => clusterApiUrl(network), [network]);
  const heliusEndpoint = process.env.NEXT_PUBLIC_RPC_URL || '';
  const heliusAvailable = Boolean(heliusEndpoint);

  const [rpcOption, setRpcOptionState] = useState<RpcOption>(
    heliusAvailable ? 'helius' : 'devnet'
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(RPC_STORAGE_KEY);
    if (stored === 'helius' && heliusAvailable) {
      setRpcOptionState('helius');
      return;
    }
    if (stored === 'devnet') {
      setRpcOptionState('devnet');
    }
  }, [heliusAvailable]);

  const setRpcOption = (next: RpcOption) => {
    if (next === 'helius' && !heliusAvailable) return;
    setRpcOptionState(next);
    window.localStorage.setItem(RPC_STORAGE_KEY, next);
  };

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => {
    if (rpcOption === 'helius' && heliusAvailable) {
      return heliusEndpoint;
    }
    return devnetEndpoint;
  }, [rpcOption, heliusAvailable, heliusEndpoint, devnetEndpoint]);

  const wallets = useMemo(
    () => [
      /**
       * Wallets that implement either of these standards will be available automatically.
       *
       *   - Solana Mobile Stack Mobile Wallet Adapter Protocol (https://github.com/solana-mobile/mobile-wallet-adapter)
       *   - Solana Wallet Standard (https://github.com/solana-labs/wallet-standard)
       *
       * If you wish to support a wallet that supports neither of those standards,
       * instantiate its legacy adapter here. Common legacy adapters can be found
       * in the npm package `@solana/wallet-adapter-wallets`.
       */
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <RpcContext.Provider value={{ rpcOption, setRpcOption, endpoint, heliusAvailable }}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </RpcContext.Provider>
  );
}
