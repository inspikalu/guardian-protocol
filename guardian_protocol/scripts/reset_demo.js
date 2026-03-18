const anchor = require("@coral-xyz/anchor");

async function main() {
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
    const wallet = new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(
        Buffer.from(JSON.parse(require("fs").readFileSync("/home/inspiuser/.config/solana/id.json", "utf8")))
    ));
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    anchor.setProvider(provider);

    const rbacIdl = JSON.parse(require("fs").readFileSync("./target/idl/rbac.json", "utf8"));
    const circuitsIdl = JSON.parse(require("fs").readFileSync("./target/idl/circuit_breaker.json", "utf8"));
    const locksIdl = JSON.parse(require("fs").readFileSync("./target/idl/lock_manager.json", "utf8"));

    const rbacProgram = new anchor.Program(rbacIdl, provider);
    const circuitsProgram = new anchor.Program(circuitsIdl, provider);
    const locksProgram = new anchor.Program(locksIdl, provider);

    console.log("Resetting demo accounts on Devnet...");

    const names = ["vault", "vault-v2"];

    for (const name of names) {
        console.log(`Resetting accounts for '${name}'...`);

        // 1. Close role
        try {
            const [rolePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("role"), Buffer.from("Treasurer")],
                rbacProgram.programId
            );
            await rbacProgram.methods.closeRole("Treasurer")
                .accounts({
                    admin: provider.wallet.publicKey,
                    role: rolePda,
                })
                .rpc();
            console.log(`Closed role 'Treasurer' (if existed)`);
        } catch (e) {}

        // 1b. Close assignment
        try {
            const [rolePda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("role"), Buffer.from("Treasurer")],
                rbacProgram.programId
            );
            const [assignmentPda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("assignment"), provider.wallet.publicKey.toBuffer(), rolePda.toBuffer()],
                rbacProgram.programId
            );
            await rbacProgram.methods.forceCloseAssignment(provider.wallet.publicKey, rolePda)
                .accounts({
                    admin: provider.wallet.publicKey,
                    assignment: assignmentPda,
                })
                .rpc();
            console.log(`Closed assignment for 'Treasurer'`);
        } catch (e) {}

        // 2. Close circuit
        try {
            const [circuitPda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("circuit"), Buffer.from(name)],
                circuitsProgram.programId
            );
            await circuitsProgram.methods.closeCircuit(name)
                .accounts({
                    authority: provider.wallet.publicKey,
                    circuit: circuitPda,
                })
                .rpc();
            console.log(`Closed circuit '${name}'`);
        } catch (e) {}

        // 3. Close lock
        try {
            const [lockPda] = anchor.web3.PublicKey.findProgramAddressSync(
                [Buffer.from("lock"), Buffer.from(name)],
                locksProgram.programId
            );
            await locksProgram.methods.closeLock(name)
                .accounts({
                    authority: provider.wallet.publicKey,
                    lock: lockPda,
                })
                .rpc();
            console.log(`Closed lock '${name}'`);
        } catch (e) {}
    }

    console.log("Reset complete. Now run 'node scripts/setup_demo.js' to re-initialize.");
}

main();
