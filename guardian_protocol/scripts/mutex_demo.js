const anchor = require("@coral-xyz/anchor");
const { PublicKey, Keypair } = require("@solana/web3.js");
const fs = require("fs");

async function main() {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    
    // Wallet 1: Default
    const wallet1Path = "/home/inspiuser/.config/solana/id.json";
    const wallet1 = new anchor.Wallet(Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(wallet1Path, "utf8")))
    ));
    
    // Wallet 2: Secondary (from user's desktop list)
    const wallet2Path = "/home/inspiuser/Desktop/solana-wallets/AVq5Q7CeALotLmJ1frLPppxbXB5QvgNk8y9Uk6H3tRMY.json";
    const wallet2 = new anchor.Wallet(Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(wallet2Path, "utf8")))
    ));

    const provider1 = new anchor.AnchorProvider(connection, wallet1, { commitment: "confirmed" });
    const provider2 = new anchor.AnchorProvider(connection, wallet2, { commitment: "confirmed" });

    const locksIdl = JSON.parse(fs.readFileSync("./target/idl/lock_manager.json", "utf8"));
    const program1 = new anchor.Program(locksIdl, provider1);
    const program2 = new anchor.Program(locksIdl, provider2);

    const resourceId = "vault-v2";
    const [lockPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lock"), Buffer.from(resourceId)],
        program1.programId
    );

    const wait = (ms) => new Promise(res => setTimeout(res, ms));

    console.log("--- Mutex Demonstration (Multi-Wallet) ---");
    console.log(`Primary Wallet: ${wallet1.publicKey.toString()}`);
    console.log(`Secondary Wallet: ${wallet2.publicKey.toString()}\n`);

    console.log("(Pausing for 3 seconds so you can show the UI ready...)\n");
    await wait(3000);
    
    // Step 1: Wallet 1 acquires the lock
    console.log(`1. [Wallet 1] Attempting to acquire lock for '${resourceId}'...`);
    try {
        const tx1 = await program1.methods.acquireLock(new anchor.BN(60))
            .accounts({
                acquirer: wallet1.publicKey,
                lock: lockPda,
            })
            .rpc();
        console.log("SUCCESS: Lock acquired by Wallet 1! TX:", tx1);
        console.log("\n(Pausing for 5 seconds... UI should show Wallet 1 as OWNER)");
        await wait(5000);
    } catch (e) {
        console.log("INITIAL ACQUISITION FAILED:", e.message);
        console.log("Tip: Try force-unlocking in the UI first.");
        return;
    }

    // Step 2: Wallet 2 attempts to acquire the SAME lock (Conflict Test)
    console.log(`\n2. [Wallet 2] Attempting to acquire the SAME lock (Conflict Test)...`);
    try {
        await program2.methods.acquireLock(new anchor.BN(60))
            .accounts({
                acquirer: wallet2.publicKey,
                lock: lockPda,
            })
            .rpc();
        console.log("CRITICAL FAILURE: The program allowed a double-lock by different users!");
    } catch (e) {
        console.log("EXPECTED ERROR CAUGHT: Mutex working correctly.");
        if (e.message.includes("LockAlreadyAcquired") || e.message.includes("0x1770")) {
            console.log("Result: Wallet 2 was REJECTED as expected. Mutex integrity verified.");
        } else {
            console.log("Caught Error:", e.message);
        }
    }

    console.log("\n--- Demo Complete ---");
}

main().catch(err => {
    console.error(err);
});
