
const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");

async function main() {
    const rbacProgramId = new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");
    const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgramId
    );
    
    const connection = new anchor.web3.Connection("https://api.devnet.solana.com");
    const info = await connection.getAccountInfo(authorityPda);
    
    if (info) {
        // Decode Authority account. 8 bytes discriminator + Pubkey (32) + i64 (8) + u8 (1)
        const admin = new PublicKey(info.data.slice(8, 40));
        console.log("Authority Admin:", admin.toString());
    } else {
        console.log("Authority is NOT INITIALIZED");
    }
}

main();
