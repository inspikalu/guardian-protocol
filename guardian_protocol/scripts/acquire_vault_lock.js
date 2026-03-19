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

  const [lockPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('lock'), Buffer.from('vault')],
    program.programId
  );

  const [receiptPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('receipt'), lockPda.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log('Acquiring vault lock for 300 seconds (5 minutes)...');
  try {
    const tx = await program.methods.acquireLock(new anchor.BN(300))
      .accounts({
        acquirer: wallet.publicKey,
        lock: lockPda,
        receipt: receiptPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log('✓ Successfully acquired lock. TX:', tx);
    console.log('\\nThe vault lock is now OCCUPIED.');
  } catch (err) {
    if (err.message.includes('LockAlreadyAcquired')) {
      console.log('✗ Lock is already acquired! Force unlock it first from the UI.');
    } else {
      console.error('✗ Failed to acquire lock:', err);
    }
  }
}

main().catch(console.error);
