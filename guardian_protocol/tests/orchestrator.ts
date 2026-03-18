import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Orchestrator } from "../target/types/orchestrator";
import { Rbac } from "../target/types/rbac";
import { CircuitBreaker } from "../target/types/circuit_breaker";
import { LockManager } from "../target/types/lock_manager";
import { expect } from "chai";

describe("orchestrator", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const orchestrator = anchor.workspace.Orchestrator as Program<Orchestrator>;
  const rbac = anchor.workspace.Rbac as Program<Rbac>;
  const cb = anchor.workspace.CircuitBreaker as Program<CircuitBreaker>;
  const lockManager = anchor.workspace.LockManager as Program<LockManager>;

  const admin = provider.wallet;

  const airdrop = async (pubkey: anchor.web3.PublicKey) => {
    const signature = await provider.connection.requestAirdrop(pubkey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
  };

  const getPda = (seeds: (Buffer | Uint8Array)[], program: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(seeds, program)[0];

  it("Executes a full protected operation chain", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);

    // 1. Setup RBAC
    try {
        await rbac.methods.initializeAuthority().accounts({ admin: admin.publicKey }).rpc();
    } catch (e) {}

    const roleName = "orch-role-" + Date.now();
    const rolePda = getPda([Buffer.from("role"), Buffer.from(roleName)], rbac.programId);
    
    await rbac.methods
      .createRole(roleName, [{ treasuryWithdraw: { maxAmount: new anchor.BN(5000) } }], null, null)
      .accounts({ admin: admin.publicKey })
      .rpc();

    await rbac.methods
      .grantRole(user.publicKey, null, false)
      .accounts({ 
        granter: admin.publicKey, 
        role: rolePda,
        granterAssignment: null, // CRITICAL FIX
      })
      .rpc();

    const assignmentPda = getPda(
      [Buffer.from("assignment"), user.publicKey.toBuffer(), rolePda.toBuffer()],
      rbac.programId
    );

    // 2. Setup Circuit Breaker
    const circuitName = "orch-cb-" + Date.now();
    const circuitPda = getPda([Buffer.from("circuit"), Buffer.from(circuitName)], cb.programId);
    await cb.methods
      .createCircuit(circuitName, "Orch Label", 5, 5, new anchor.BN(10))
      .accounts({ authority: admin.publicKey })
      .rpc();

    // 3. Setup Lock Manager
    const resourceId = "orch-res-" + Date.now();
    const lockPda = getPda([Buffer.from("lock"), Buffer.from(resourceId)], lockManager.programId);
    await lockManager.methods
      .createLock(resourceId, new anchor.BN(60), true)
      .accounts({ authority: admin.publicKey })
      .rpc();

    const lockReceiptPda = getPda(
      [Buffer.from("receipt"), lockPda.toBuffer(), user.publicKey.toBuffer()],
      lockManager.programId
    );

    // 4. Call Orchestrator
    const auditCounter = new anchor.BN(Date.now());
    const auditPda = getPda(
      [Buffer.from("audit"), auditCounter.toBuffer("le", 8)],
      rbac.programId
    );

    await orchestrator.methods
      .protectedOperation(
        { treasuryWithdraw: { maxAmount: new anchor.BN(1000) } },
        new anchor.BN(30),
        auditCounter
      )
      .accounts({
        user: user.publicKey,
        rbacRole: rolePda,
        rbacAssignment: assignmentPda,
        auditLog: auditPda,
        rbacProgram: rbac.programId,
        circuit: circuitPda,
        circuitBreakerProgram: cb.programId,
        lock: lockPda,
        lockReceipt: lockReceiptPda,
        lockManagerProgram: lockManager.programId,
      })
      .signers([user])
      .rpc();

    // Verification
    const auditAcc = await rbac.account.auditLog.fetch(auditPda);
    expect(auditAcc.success).to.be.true;
    
    const lockAcc = await lockManager.account.distributedLock.fetch(lockPda);
    expect(lockAcc.state).to.have.property("available");
  });
});
