const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

async function main() {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const wallet = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require("fs").readFileSync("/home/inspiuser/.config/solana/id.json", "utf8")))
    ));
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    const locksIdl = JSON.parse(require("fs").readFileSync("./target/idl/lock_manager.json", "utf8"));
    const locksProgram = new anchor.Program(locksIdl, provider);

    const resourceId = "vault-v2";
    const [lockPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lock"), Buffer.from(resourceId)],
        locksProgram.programId
    );

    console.log("Releasing lock for:", resourceId);
    try {
        const tx = await locksProgram.methods.releaseLock()
            .accounts({
                user: provider.wallet.publicKey,
                lock: lockPda,
            })
            .rpc();
        console.log("Lock released! TX:", tx);
    } catch (e) {
        console.error("Failed to release lock:", e.message);
    }
}

main();
