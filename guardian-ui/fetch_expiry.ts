
// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
    const rbacIdl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian-ui/src/lib/anchor/idls/rbac.json", "utf8"));
    const programId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    // We don't have a wallet file, but we can use a dummy provider for read-only access
    const provider = new anchor.AnchorProvider(connection, {} as any, { commitment: "confirmed" });
    const program = new anchor.Program(rbacIdl, provider);
    
    const targetUser = new PublicKey("7iR7WEHdZxcRnJyC8hREhJ2Z9hE4prPFZQmLCKrDsbmB");
    
    console.log("Fetching assignments for user:", targetUser.toBase58());
    
    const assignments = await program.account.roleAssignment.all([
        {
            memcmp: {
                offset: 8, // Discriminator
                bytes: targetUser.toBase58()
            }
        }
    ]);
    
    if (assignments.length === 0) {
        console.log("No assignments found for this user.");
        return;
    }
    
    for (const assignment of assignments) {
        const rolePda = assignment.account.role;
        const role = await program.account.role.fetch(rolePda);
        const expiresAt = assignment.account.expiresAt;
        
        console.log("--- Assignment ---");
        console.log("Role Name:", role.name);
        if (expiresAt) {
            const date = new Date(expiresAt.toNumber() * 1000);
            console.log("Expiry Timestamp:", expiresAt.toString());
            console.log("Expiry Date (UTC):", date.toUTCString());
            console.log("Expiry Date (Local):", date.toLocaleString());
        } else {
            console.log("Expiry: Permanent");
        }
    }
}

main().catch(console.error);
