
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
    const rbacIdl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian-ui/src/lib/anchor/idls/rbac.json", "utf8"));
    const programId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    const provider = new anchor.AnchorProvider(connection, {} as any, { commitment: "confirmed" });
    const program = new anchor.Program(rbacIdl, provider);
    
    console.log("Fetching all accounts for program:", programId.toBase58());
    const accounts = await connection.getProgramAccounts(programId);
    console.log("Found", accounts.length, "accounts.");
    
    for (const { pubkey, account } of accounts) {
        try {
            const decoded = program.coder.accounts.decode("RoleAssignment", account.data);
            console.log("--- Assignment ---");
            console.log("PDA:", pubkey.toBase58());
            console.log("User:", decoded.user.toBase58());
            console.log("Role PDA:", decoded.role.toBase58());
            const expiresAt = decoded.expiresAt;
            if (expiresAt) {
                const date = new Date(expiresAt.toNumber() * 1000);
                console.log("Expiry Date UTC:", date.toUTCString());
            } else {
                console.log("Expiry: Permanent");
            }
        } catch (e) {
            // Check if it's a Role
            try {
                const decodedRole = program.coder.accounts.decode("Role", account.data);
                console.log("--- Role ---");
                console.log("PDA:", pubkey.toBase58());
                console.log("Name:", decodedRole.name);
            } catch (e2) {}
        }
    }
}

main().catch(console.error);
