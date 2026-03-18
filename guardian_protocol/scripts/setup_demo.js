
const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

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

    // In Anchor 0.30+, the Program constructor might need the IDL to be passed slightly differently if it's not detected
    const rbacProgram = new anchor.Program(rbacIdl, provider);
    const circuitsProgram = new anchor.Program(circuitsIdl, provider);
    const locksProgram = new anchor.Program(locksIdl, provider);

    const rbacProgramId = rbacProgram.programId;
    const circuitsProgramId = circuitsProgram.programId;
    const locksProgramId = locksProgram.programId;

    console.log("Current wallet:", provider.wallet.publicKey.toString());

    // 1. Create 'vault' circuit
    const [circuitPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("circuit"), Buffer.from("vault")],
        circuitsProgramId
    );
    try {
        await circuitsProgram.methods.createCircuit("vault", "Vault Sentinel", 5, 3, new anchor.BN(60))
            .accounts({
                authority: provider.wallet.publicKey,
                circuit: circuitPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("Circuit 'vault' created");
    } catch (e) {
        console.log("Circuit 'vault' already exists or failed:", e.message);
    }

    // 2. Create 'vault' lock
    const [lockPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lock"), Buffer.from("vault")],
        locksProgramId
    );
    try {
        await locksProgram.methods.createLock("vault", new anchor.BN(3600), true)
            .accounts({
                authority: provider.wallet.publicKey,
                lock: lockPda,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("Lock 'vault' created");
    } catch (e) {
        console.log("Lock 'vault' already exists or failed:", e.message);
    }

    // 3. Create 'Treasurer' role
    const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgramId
    );
    const [rolePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("role"), Buffer.from("Treasurer")],
        rbacProgramId
    );
    try {
        await rbacProgram.methods.createRole(
            "Treasurer",
            [{ treasuryWithdraw: { maxAmount: new anchor.BN(1000) } }],
            null,
            null
        )
        .accounts({
            admin: provider.wallet.publicKey,
            authority: authorityPda,
            role: rolePda,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
        console.log("Role 'Treasurer' created");
    } catch (e) {
        console.log("Role 'Treasurer' already exists or failed:", e.message);
    }

    // 4. Assign role to self
    const [assignmentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("assignment"), provider.wallet.publicKey.toBuffer(), rolePda.toBuffer()],
        rbacProgramId
    );
    try {
        const grantTx = await rbacProgram.methods
            .grantRole(provider.wallet.publicKey, null, true)
            .accounts({
                granter: provider.wallet.publicKey,
                role: rolePda,
                assignment: assignmentPda,
                granterAssignment: null,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        console.log("Assigned 'Treasurer' role to self. TX:", grantTx);
    } catch (e) {
        console.log("Role already assigned or failed:", e.message);
    }
}

main();
