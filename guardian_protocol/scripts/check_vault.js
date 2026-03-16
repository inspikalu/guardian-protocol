
const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

async function main() {
    const circuitsProgramId = new PublicKey("9GXUR2xcVDxnu1JNEdDqCrLRL9K44t5iYxcTWekMaPma");
    const [circuitPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("circuit"), Buffer.from("vault")],
        circuitsProgramId
    );
    
    const locksProgramId = new PublicKey("reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j");
    const [lockPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lock"), Buffer.from("vault")],
        locksProgramId
    );

    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    
    const circuitInfo = await connection.getAccountInfo(circuitPda);
    console.log("Circuit 'vault' exists:", !!circuitInfo);

    const lockInfo = await connection.getAccountInfo(lockPda);
    console.log("Lock 'vault' exists:", !!lockInfo);
}

main();
