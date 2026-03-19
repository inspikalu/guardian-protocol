'use client';

import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  getAnchorProvider, 
  getRbacProgram, 
  getCircuitsProgram, 
  getLocksProgram, 
  getOrchestratorProgram
} from '@/lib/anchor';

export function useAnchorProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet.publicKey) return null;
    return getAnchorProvider(connection, wallet);
  }, [connection, wallet]);

  const rbacProgram = useMemo(() => {
    if (!provider) return null;
    return getRbacProgram(provider);
  }, [provider]);

  const circuitsProgram = useMemo(() => {
    if (!provider) return null;
    return getCircuitsProgram(provider);
  }, [provider]);

  const locksProgram = useMemo(() => {
    if (!provider) return null;
    return getLocksProgram(provider);
  }, [provider]);

  const orchestratorProgram = useMemo(() => {
    if (!provider) return null;
    return getOrchestratorProgram(provider);
  }, [provider]);

  return {
    provider,
    rbacProgram,
    circuitsProgram,
    locksProgram,
    orchestratorProgram,
  };
}
