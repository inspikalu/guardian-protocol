import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LockManager } from "../target/types/lock_manager";
import { expect } from "chai";

describe("lock-manager", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LockManager as Program<LockManager>;
  const authority = provider.wallet;

  const airdrop = async (pubkey: anchor.web3.PublicKey) => {
    const signature = await provider.connection.requestAirdrop(pubkey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
  };

  const resourceId = "lock-res-" + Date.now();
  const [lockPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("lock"), Buffer.from(resourceId)],
    program.programId
  );

  it("Creates a lock", async () => {
    await program.methods
      .createLock(resourceId, new anchor.BN(5), true)
      .accounts({
        authority: authority.publicKey,
      })
      .rpc();

    const lockAccount = await program.account.distributedLock.fetch(lockPda);
    expect(lockAccount.resourceId).to.equal(resourceId);
  });

  it("Acquires a lock", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);

    const [receiptPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), lockPda.toBuffer(), user.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .acquireLock(new anchor.BN(3))
      .accounts({
        acquirer: user.publicKey,
        lock: lockPda,
      })
      .signers([user])
      .rpc();

    const lockAccount = await program.account.distributedLock.fetch(lockPda);
    expect(lockAccount.state).to.have.property("locked");
  });

  it("Allows reentrant acquisition", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);

    const res2 = "res-2-" + Date.now();
    const [lock2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lock"), Buffer.from(res2)],
      program.programId
    );
    await program.methods.createLock(res2, new anchor.BN(10), true).accounts({authority: authority.publicKey}).rpc();

    const [receipt2Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("receipt"), lock2Pda.toBuffer(), user.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.acquireLock(new anchor.BN(5)).accounts({acquirer: user.publicKey, lock: lock2Pda}).signers([user]).rpc();
    
    // For reentrancy, we pass the same receipt as it already exists
    await program.methods.acquireLock(new anchor.BN(5)).accounts({
        acquirer: user.publicKey, 
        lock: lock2Pda,
        receipt: receipt2Pda // Explicitly pass existing receipt
    }).signers([user]).rpc();

    const lockAcc = await program.account.distributedLock.fetch(lock2Pda);
    expect(lockAcc.reentrancyCount).to.equal(1);
  });

  it("Blocks acquisition by another user", async () => {
    const owner = anchor.web3.Keypair.generate();
    const attacker = anchor.web3.Keypair.generate();
    await airdrop(owner.publicKey);
    await airdrop(attacker.publicKey);

    const res3 = "res-3-" + Date.now();
    const [lock3Pda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lock"), Buffer.from(res3)],
      program.programId
    );
    await program.methods.createLock(res3, new anchor.BN(10), true).accounts({authority: authority.publicKey}).rpc();

    await program.methods.acquireLock(new anchor.BN(5)).accounts({acquirer: owner.publicKey, lock: lock3Pda}).signers([owner]).rpc();

    try {
      await program.methods.acquireLock(new anchor.BN(5)).accounts({acquirer: attacker.publicKey, lock: lock3Pda}).signers([attacker]).rpc();
      expect.fail("Should have blocked attacker");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("LockAlreadyAcquired");
    }
  });
});
