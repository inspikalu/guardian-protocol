const anchor = require('@coral-xyz/anchor');
const { PublicKey } = require('@solana/web3.js');
const fs = require('fs');

const HELIUS_RPC = 'https://devnet.helius-rpc.com/?api-key=8dabc2e1-a043-4c0a-a675-52273c7ac948';
const WALLET_DIR = process.env.SOLANA_WALLET_DIR || '/home/inspiuser/Desktop/solana-wallets';

// Default wallet to use for acquiring the vault lock.
// (Avoid storing a list of many wallets; keep it explicit.)
const DEFAULT_WALLET_FILE = 'AVq5Q7CeALotLmJ1frLPppxbXB5QvgNk8y9Uk6H3tRMY.json';

// You can override via: `SOLANA_WALLET_FILE=... node acquire_vault_lock.js`
const WALLET_FILE = process.env.SOLANA_WALLET_FILE || DEFAULT_WALLET_FILE;

async function main() {
  const connection = new anchor.web3.Connection(HELIUS_RPC, 'confirmed');

  const walletPath = `${WALLET_DIR}/${WALLET_FILE}`;
  if (!fs.existsSync(walletPath)) {
    throw new Error(`Wallet file not found: ${walletPath}`);
  }

  const secretKeyBytes = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(
      Buffer.from(secretKeyBytes)
    )
  );
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const idl = JSON.parse(fs.readFileSync('./target/idl/lock_manager.json', 'utf8'));
  const program = new anchor.Program(idl, provider);

  // Helpful debugging: ensure we're using a funded wallet.
  const balanceLamports = await connection.getBalance(wallet.publicKey);
  console.log('Using wallet:', wallet.publicKey.toBase58());
  console.log('Wallet balance (lamports):', balanceLamports.toString());

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
