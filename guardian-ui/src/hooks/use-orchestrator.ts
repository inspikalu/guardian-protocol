'use client';

import { useAnchorProgram } from "@/hooks/use-anchor-program";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { PROGRAM_IDS } from "@/lib/anchor";

export function useOrchestrator() {
  const { orchestratorProgram, provider } = useAnchorProgram();

  const runProtectedOperation = async (
    roleName: string,
    permissionType: string,
    leaseDuration: number,
    auditCounter: number
  ) => {
    if (!orchestratorProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      // PDA for the authority
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        PROGRAM_IDS.rbac
      );

      // PDA for the role
      const [rolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role"), Buffer.from(roleName)],
        PROGRAM_IDS.rbac
      );

      // PDA for the assignment (using current user)
      const [assignmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("assignment"), provider.wallet.publicKey.toBuffer(), rolePda.toBuffer()],
        PROGRAM_IDS.rbac
      );

      // PDA for the circuit (using a resource name, e.g., "vault")
      const [circuitPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("circuit"), Buffer.from("vault")],
        PROGRAM_IDS.circuits
      );

      // PDA for the lock (using a resource name, e.g., "vault")
      const [lockPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lock"), Buffer.from("vault")],
        PROGRAM_IDS.locks
      );

      // PDA for the lock receipt
      const [receiptPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("receipt"), lockPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
        PROGRAM_IDS.locks
      );

      // PDA for the audit log
      const [auditLogPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("audit"), new anchor.BN(auditCounter).toArrayLike(Buffer, 'le', 8)],
        PROGRAM_IDS.rbac
      );

      // Map permission
      const permission = { [permissionType.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())]: {} };
      if (permissionType === 'TreasuryWithdraw') {
        (permission as any).treasuryWithdraw = { maxAmount: new anchor.BN(100) };
      }

      const tx = await (orchestratorProgram as any).methods
        .protectedOperation(permission, new anchor.BN(leaseDuration), new anchor.BN(auditCounter))
        .accounts({
          user: provider.wallet.publicKey,
          rbacRole: rolePda,
          rbacAssignment: assignmentPda,
          auditLog: auditLogPda,
          rbacProgram: PROGRAM_IDS.rbac,
          circuit: circuitPda,
          circuitBreakerProgram: PROGRAM_IDS.circuits,
          lock: lockPda,
          lockReceipt: receiptPda,
          lockManagerProgram: PROGRAM_IDS.locks,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      await provider.connection.confirmTransaction(tx, "confirmed");
      return tx;
    } catch (error: any) {
      console.error("Protected operation failed:", error);
      throw error;
    }
  };

  return {
    runProtectedOperation,
  };
}
