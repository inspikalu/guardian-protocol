
// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
    console.log("Starting account dump...");
    const rbacIdl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian-ui/src/lib/anchor/idls/rbac.json", "utf8"));
    const programId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    const provider = new anchor.AnchorProvider(connection, {} as any, { commitment: "confirmed" });
    const program = new anchor.Program(rbacIdl, provider);
    
    const accounts = await connection.getProgramAccounts(programId);
    console.log("Total accounts found:", accounts.length);
    
    for (const { pubkey, account } of accounts) {
        // Try to decode based on discriminator
        const discriminator = account.data.slice(0, 8);
        
        // Match RoleAssignment discriminator [205, 130, 191, 231, 211, 225, 155, 246]
        const roleAssignmentDisc = Buffer.from([205, 130, 191, 231, 211, 225, 155, 246]);
        const roleDisc = Buffer.from([46, 219, 197, 24, 233, 249, 253, 154]);
        
        if (discriminator.equals(roleAssignmentDisc)) {
            try {
                const decoded = program.coder.accounts.decode("RoleAssignment", account.data);
                console.log("\n--- Assignment ---");
                console.log("PDA:", pubkey.toBase58());
                console.log("User:", decoded.user.toBase58());
                console.log("Role:", decoded.role.toBase58());
                if (decoded.expiresAt) {
                    const date = new Date(decoded.expiresAt.toNumber() * 1000);
                    console.log("ExpiresAt:", decoded.expiresAt.toString(), "(", date.toUTCString(), ")");
                } else {
                    console.log("ExpiresAt: Permanent");
                }
            } catch (e: any) { 
                console.log("\n--- PDA:", pubkey.toBase58(), "---");
                console.log("Type: RoleAssignment (Decode error:", e.message, ")");
            }
        } else if (discriminator.equals(roleDisc)) {
            try {
                const decoded = program.coder.accounts.decode("Role", account.data);
                console.log("\n--- Role ---");
                console.log("PDA:", pubkey.toBase58());
                console.log("Name:", decoded.name);
            } catch (e: any) { 
                console.log("\n--- PDA:", pubkey.toBase58(), "---");
                console.log("Type: Role (Decode error:", e.message, ")");
            }
        }
    }
}

main().catch(console.error);
