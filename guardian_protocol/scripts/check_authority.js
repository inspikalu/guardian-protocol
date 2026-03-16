
const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

async function main() {
    const rbacProgramId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgramId
    );
    console.log("Authority PDA:", authorityPda.toString());

    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    const info = await connection.getAccountInfo(authorityPda);
    
    if (info) {
        console.log("Authority is INITIALIZED");
    } else {
        console.log("Authority is NOT INITIALIZED");
    }
}

main();
