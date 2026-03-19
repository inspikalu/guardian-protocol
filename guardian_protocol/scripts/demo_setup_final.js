/**
 * demo_setup_final.js
 * 
 * Sets up the EXACT state for the demo video:
 *   - Closes ALL circuits except "vault"
 *   - Ensures "vault" circuit exists and is in Closed (healthy) state
 * 
 * Demo sequence after running this:
 *   1. Lab page → Run Protocol Audit → SUCCESS (vault is Closed)
 *   2. Circuits page → Trip "vault" (Force Open)
 *   3. Lab page → Run Protocol Audit → FAILS (vault is Open)
 * 
 * Run with: node scripts/demo_setup_final.js
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const fs = require("fs");

const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=8dabc2e1-a043-4c0a-a675-52273c7ac948";
const CIRCUIT_DISC = Buffer.from([113, 209, 5, 225, 233, 216, 248, 61]);

async function main() {
  const connection = new anchor.web3.Connection(HELIUS_RPC, "confirmed");
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync("/home/inspiuser/.config/solana/id.json", "utf8")))
    )
  );
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idl = JSON.parse(fs.readFileSync("./target/idl/circuit_breaker.json", "utf8"));
  const program = new anchor.Program(idl, provider);
  const programId = program.programId;

  console.log("Wallet:", wallet.publicKey.toString());
  console.log("Program:", programId.toString());
  console.log("");

  // ── Step 1: Find all circuit accounts on-chain ────────────────────────────
  console.log("=== Scanning on-chain circuit accounts ===");
  const rawAccounts = await connection.getProgramAccounts(programId);
  const circuitAccounts = rawAccounts.filter(a =>
    a.account.data.length >= 8 && a.account.data.slice(0, 8).equals(CIRCUIT_DISC)
  );
  console.log(`Found ${circuitAccounts.length} circuit account(s).`);

  // Decode the name from fixed [u8;32] at offset 8
  function decodeName(data) {
    const slice = data.slice(8, 40);
    const nullIdx = slice.indexOf(0);
    return slice.slice(0, nullIdx === -1 ? 32 : nullIdx).toString("utf8");
  }

  // ── Step 2: Close all circuits that are NOT "vault" ───────────────────────
  console.log("\n=== Closing non-vault circuits ===");
  for (const { pubkey, account } of circuitAccounts) {
    const name = decodeName(account.data);
    if (name === "vault") {
      console.log(`  Keeping 'vault' at ${pubkey.toString()}`);
      continue;
    }
    try {
      await program.methods.closeCircuit(name)
        .accounts({ authority: wallet.publicKey, circuit: pubkey })
        .rpc();
      console.log(`  ✓ Closed '${name}'`);
    } catch (e) {
      console.log(`  ✗ Could not close '${name}': ${e.message}`);
    }
  }

  // ── Step 3: Ensure vault exists ───────────────────────────────────────────
  console.log("\n=== Ensuring 'vault' circuit exists ===");
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("circuit"), Buffer.from("vault")],
    programId
  );
  const vaultInfo = await connection.getAccountInfo(vaultPda);
  if (!vaultInfo) {
    const tx = await program.methods
      .createCircuit("vault", "Vault Sentinel", 5, 3, new anchor.BN(60))
      .accounts({
        authority: wallet.publicKey,
        circuit: vaultPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log(`  ✓ Created 'vault' circuit. TX: ${tx}`);
  } else {
    // Check if it's in Open state — if so, reset it back to Closed
    const stateVariant = vaultInfo.data.readUInt8(104);
    const stateLabel = ["Closed", "Open", "HalfOpen"][stateVariant] ?? "Unknown";
    console.log(`  'vault' already exists. State: ${stateLabel}`);
    if (stateVariant !== 0) {
      try {
        const tx = await program.methods.resetCircuit()
          .accounts({ authority: wallet.publicKey, circuit: vaultPda })
          .rpc();
        console.log(`  ✓ Reset 'vault' to Closed. TX: ${tx}`);
      } catch (e) {
        console.log(`  ✗ Could not reset 'vault': ${e.message}`);
      }
    } else {
      console.log(`  'vault' is already Closed — ready for demo!`);
    }
  }

  console.log(`\nDone!`);
  console.log(`\nDemo sequence:`);
  console.log(`  1. Open http://localhost:3000/lab → click "Run Protocol Audit" → should SUCCEED`);
  console.log(`  2. Open http://localhost:3000/circuits → click "Trip" on the vault circuit`);
  console.log(`  3. Back on http://localhost:3000/lab → click "Run Protocol Audit" → should FAIL`);
}

main().catch(console.error);
