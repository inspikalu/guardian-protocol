const anchor = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const HELIUS_RPC = 'https://devnet.helius-rpc.com/?api-key=8dabc2e1-a043-4c0a-a675-52273c7ac948';

async function main() {
  const connection = new anchor.web3.Connection(HELIUS_RPC, 'confirmed');
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync('/home/inspiuser/.config/solana/id.json', 'utf8')))
    )
  );
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const idl = JSON.parse(fs.readFileSync('./target/idl/lock_manager.json', 'utf8'));
  const program = new anchor.Program(idl, provider);

  const resourceId = 'lock-res-1773871607382';
  
  // Note: the IDL expects string for generation but on-chain it expects exactly [u8; 64] padded.
  // BUT the instruction itself takes `String`, not the raw array.
  // Wait, the Rust code: `let seeds = [b"lock", resource_id.as_bytes()];`
  // And the lock PDA is derived using `b"lock"` and the raw string bytes.
  // BUT in our IDL, does it take a string? Yes.
  
  // Wait, if the onchain instruction `close_lock` takes a String argument, 
  // Anchor handles the string serialization automatically. Let's just pass the string.

  const [lockPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lock'), Buffer.from(resourceId)],
    program.programId
  );

  console.log(`Closing lock account ${lockPda.toBase58()}...`);
  try {
    const tx = await program.methods.closeLock(resourceId)
      .accounts({
        authority: wallet.publicKey,
        lock: lockPda,
      })
      .rpc();
    console.log('✓ Successfully closed lock. TX:', tx);
  } catch (err) {
    console.error('✗ Failed with exact string:', err);
  }
}

main().catch(console.error);
