'use client';

import { useAnchorProgram } from "@/hooks/use-anchor-program";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export function useCircuits() {
  const { circuitsProgram, provider } = useAnchorProgram();

  const forceOpen = async (circuitPubkey: string) => {
    if (!circuitsProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const circuit = new PublicKey(circuitPubkey);
      const tx = await (circuitsProgram as any).methods
        .forceOpen()
        .accounts({
          authority: provider.wallet.publicKey,
          circuit: circuit,
        })
        .transaction();
      const sig = await provider.sendAndConfirm(tx, []);
      toast.success("Circuit force-opened!");
      return sig;
    } catch (error: any) {
      console.error("Failed to force open circuit:", error);
      toast.error("Action failed", { description: error.message });
      throw error;
    }
  };

  const resetCircuit = async (circuitPubkey: string) => {
    if (!circuitsProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const circuit = new PublicKey(circuitPubkey);
      const tx = await (circuitsProgram as any).methods
        .resetCircuit()
        .accounts({
          authority: provider.wallet.publicKey,
          circuit: circuit,
        })
        .transaction();
      const sig = await provider.sendAndConfirm(tx, []);
      toast.success("Circuit reset successfully!");
      return sig;
    } catch (error: any) {
      console.error("Failed to reset circuit:", error);
      toast.error("Reset failed", { description: error.message });
      throw error;
    }
  };

  const updateLabel = async (circuitPubkey: string, newLabel: string) => {
    if (!circuitsProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const circuit = new PublicKey(circuitPubkey);
      const tx = await (circuitsProgram as any).methods
        .updateCircuitLabel(newLabel)
        .accounts({
          authority: provider.wallet.publicKey,
          circuit: circuit,
        })
        .transaction();
      const sig = await provider.sendAndConfirm(tx, []);
      toast.success("Circuit label updated!");
      return sig;
    } catch (error: any) {
      console.error("Failed to update circuit label:", error);
      toast.error("Update failed", { description: error.message });
      throw error;
    }
  };

  return {
    forceOpen,
    resetCircuit,
    updateLabel,
  };
}
