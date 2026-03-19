'use client';

import { useAnchorProgram } from "@/hooks/use-anchor-program";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export interface PermissionInput {
  type: string;
  maxAmount?: number;
}

export function useRbac() {
  const { rbacProgram, provider } = useAnchorProgram();

  const createRole = async (
    name: string,
    permissions: PermissionInput[],
    parentRole?: string,
    expiryInDays?: number
  ) => {
    if (!rbacProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const roleName = name.trim();
      if (!roleName) throw new Error("Role name is required");

      // Map simple permission inputs to the Anchor enum format
      const mappedPermissions = permissions.map(p => {
        switch (p.type) {
          case 'TreasuryWithdraw':
            return { treasuryWithdraw: { maxAmount: new anchor.BN(p.maxAmount || 0) } };
          case 'TreasuryDeposit':
            return { treasuryDeposit: {} };
          case 'RoleManagement':
            return { roleManagement: {} };
          case 'EmergencyStop':
            return { emergencyStop: {} };
          case 'ViewAudit':
            return { viewAudit: {} };
          case 'AcquireLock':
            return { acquireLock: {} };
          default:
            throw new Error(`Unknown permission type: ${p.type}`);
        }
      });

      const parentRolePubkey = parentRole ? new PublicKey(parentRole) : null;
      const expiry = expiryInDays ? new anchor.BN(Math.floor(Date.now() / 1000) + (expiryInDays * 24 * 60 * 60)) : null;

      // PDA for the authority (needed if not already initialized)
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgram.programId
      );

      // PDA for the role
      const [rolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role"), Buffer.from(roleName)],
        rbacProgram.programId
      );

      const tx = await (rbacProgram as any).methods
        .createRole(roleName, mappedPermissions, parentRolePubkey, expiry)
        .accounts({
          admin: provider.wallet.publicKey,
          authority: authorityPda,
          role: rolePda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .transaction();
      const sig = await provider.sendAndConfirm(tx, []);

      toast.success(`Role "${roleName}" created!`, {
        description: `TxID: ${sig.slice(0, 8)}...`,
      });
      return sig;
    } catch (error: any) {
      console.error("Failed to create role:", error);
      toast.error("Transaction failed", {
        description: error.message,
      });
      throw error;
    }
  };

  const grantRole = async (
    userPubkey: string,
    roleName: string,
    expiryInDays?: number,
    canDelegate: boolean = false
  ) => {
    if (!rbacProgram || !provider) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      const user = new PublicKey(userPubkey);
      
      const [rolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role"), Buffer.from(roleName)],
        rbacProgram.programId
      );

      const [assignmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("assignment"), user.toBuffer(), rolePda.toBuffer()],
        rbacProgram.programId
      );

      const expiry = expiryInDays ? new anchor.BN(Math.floor(Date.now() / 1000) + (expiryInDays * 24 * 60 * 60)) : null;

      const tx = await (rbacProgram as any).methods
        .grantRole(user, expiry, canDelegate)
        .accounts({
          granter: provider.wallet.publicKey,
          role: rolePda,
          assignment: assignmentPda,
          granterAssignment: null,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .transaction();
      const sig = await provider.sendAndConfirm(tx, []);
      toast.success(`Role "${roleName}" assigned to ${userPubkey.slice(0, 8)}...`);
      return sig;
    } catch (error: any) {
      console.error("Failed to grant role:", error);
      toast.error("Assignment failed", { description: error.message });
      throw error;
    }
  };

  const checkIsAdmin = async () => {
    if (!rbacProgram || !provider) return false;
    try {
      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgram.programId
      );
      const authorityAccount = await (rbacProgram as any).account.authority.fetch(authorityPda);
      return authorityAccount.admin.toString() === provider.wallet.publicKey.toString();
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  };

  const getAssignmentsForUser = async (userPubkey: string) => {
    if (!rbacProgram) return [];
    try {
      const allAssignments = await (rbacProgram as any).account.roleAssignment.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: userPubkey,
          },
        },
      ]);
      return allAssignments;
    } catch (error) {
      console.error("Failed to fetch user assignments:", error);
      return [];
    }
  };

  return {
    createRole,
    grantRole,
    checkIsAdmin,
    getAssignmentsForUser,
  };
}
