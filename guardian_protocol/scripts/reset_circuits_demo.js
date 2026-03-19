/**
 * reset_circuits_demo.js
 * Closes any stale circuit accounts and creates fresh ones for the demo video.
 * Run with: node scripts/reset_circuits_demo.js
 */

const anchor = require("@coral-xyz/anchor");
const { PublicKey } = require("@solana/web3.js");
const fs = require("fs");

const HELIUS_RPC = "https://devnet.helius-rpc.com/?api-key=8dabc2e1-a043-4c0a-a675-52273c7ac948";

// New circuits to create for the demo
const DEMO_CIRCUITS = [
  { name: "oracle-feed",    label: "Oracle Price Feed",      failureThreshold: 5, successThreshold: 2, timeoutSeconds: 60 },
  { name: "rpc-sentinel",   label: "RPC Sentinel",           failureThreshold: 3, successThreshold: 1, timeoutSeconds: 30 },
  { name: "treasury-guard", label: "Treasury Guard",          failureThreshold: 3, successThreshold: 2, timeoutSeconds: 45 },
];

async function main() {
  const connection = new anchor.web3.Connection(HELIUS_RPC, "confirmed");
  const wallet = new anchor.Wallet(
    anchor.web3.Keypair.fromSecretKey(
      Buffer.from(JSON.parse(fs.readFileSync("/home/inspiuser/.config/solana/id.json", "utf8")))
    )
  );
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const circuitsIdl = JSON.parse(fs.readFileSync("./target/idl/circuit_breaker.json", "utf8"));
  const circuitsProgram = new anchor.Program(circuitsIdl, provider);
  const programId = circuitsProgram.programId;

  console.log("Wallet:", provider.wallet.publicKey.toString());
  console.log("Program:", programId.toString());
  console.log("");

  // ── Step 1: Close stale existing accounts ─────────────────────────────────
  const STALE_NAMES = ["vault", "test-service"];
  console.log("=== Closing stale circuits ===");
  for (const name of STALE_NAMES) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("circuit"), Buffer.from(name)],
      programId
    );
    const info = await connection.getAccountInfo(pda);
    if (!info) {
      console.log(`  '${name}' not found on-chain, skipping.`);
      continue;
    }
    try {
      await circuitsProgram.methods
        .closeCircuit(name)
        .accounts({
          authority: provider.wallet.publicKey,
          circuit: pda,
        })
        .rpc();
      console.log(`  ✓ Closed '${name}'`);
    } catch (e) {
      console.log(`  ✗ Could not close '${name}':`, e.message);
    }
  }
  console.log("");

  // ── Step 2: Create fresh demo circuits ────────────────────────────────────
  console.log("=== Creating fresh demo circuits ===");
  for (const c of DEMO_CIRCUITS) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("circuit"), Buffer.from(c.name)],
      programId
    );

    // Check if already exists
    const existing = await connection.getAccountInfo(pda);
    if (existing) {
      console.log(`  '${c.name}' already exists at ${pda.toString()}, skipping creation.`);
      continue;
    }

    try {
      const tx = await circuitsProgram.methods
        .createCircuit(
          c.name,
          c.label,
          c.failureThreshold,
          c.successThreshold,
          new anchor.BN(c.timeoutSeconds)
        )
        .accounts({
          authority: provider.wallet.publicKey,
          circuit: pda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      console.log(`  ✓ Created '${c.name}' (${c.label})  PDA: ${pda.toString()}  TX: ${tx}`);
    } catch (e) {
      console.log(`  ✗ Could not create '${c.name}':`, e.message);
    }
  }
  console.log("\nDone! Refresh the circuits page and you should see 3 fresh circuit cards.");
}

main().catch(console.error);
