import { useAnchorProgram } from "./use-anchor-program";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export function useLocks() {
  const { locksProgram, provider } = useAnchorProgram();

  const forceUnlock = async (lockPubkey: string) => {
    if (!locksProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const lock = new PublicKey(lockPubkey);
      const tx = await (locksProgram as any).methods
        .forceUnlock()
        .accounts({
          authority: provider.wallet.publicKey,
          lock: lock,
        })
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");
      toast.success("Lock force-unlocked!");
      return tx;
    } catch (error: any) {
      console.error("Failed to force unlock:", error);
      toast.error("Action failed", { description: error.message });
      throw error;
    }
  };

  return {
    forceUnlock,
  };
}
