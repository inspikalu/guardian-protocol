
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function main() {
    console.log("Starting fetch...");
    const rbacIdl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian-ui/src/lib/anchor/idls/rbac.json", "utf8"));
    const programId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    
    const provider = new anchor.AnchorProvider(connection, {} as any, { commitment: "confirmed" });
    const program = new anchor.Program(rbacIdl, programId, provider);
    
    const targetUser = new PublicKey("7iR7WEHdZxcRnJyC8hREhJ2Z9hE4prPFZQmLCKrDsbmB");
    const roleName = "ADMIN";

    console.log("Calculating PDAs...");
    const [rolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role"), Buffer.from(roleName)],
        programId
    );
    console.log("Role PDA:", rolePda.toBase58());

    const [assignmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("assignment"), targetUser.toBuffer(), rolePda.toBuffer()],
        programId
    );
    console.log("Assignment PDA:", assignmentPda.toBase58());

    try {
        console.log("Fetching assignment account...");
        const assignment: any = await program.account.roleAssignment.fetch(assignmentPda);
        console.log("Raw account data received.");
        
        const expiresAt = assignment.expiresAt;
        if (expiresAt) {
            const date = new Date(expiresAt.toNumber() * 1000);
            console.log("RESULT_SUCCESS");
            console.log("USER:", targetUser.toBase58());
            console.log("ROLE:", roleName);
            console.log("EXPIRY_TIMESTAMP:", expiresAt.toString());
            console.log("EXPIRY_DATE_UTC:", date.toUTCString());
        } else {
            console.log("RESULT_PERMANENT");
        }
    } catch (e) {
        console.error("Error fetching account:", e);
    }
}

main().catch(console.error);
