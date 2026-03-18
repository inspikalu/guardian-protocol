import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CircuitBreaker } from "../target/types/circuit_breaker";
import { expect } from "chai";

describe("circuit-breaker", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CircuitBreaker as Program<CircuitBreaker>;
  const authority = provider.wallet;

  const circuitName = "test-service";
  const [circuitPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("circuit"), Buffer.from(circuitName)],
    program.programId
  );

  it("Creates a circuit", async () => {
    await program.methods
      .createCircuit(
        circuitName,
        "Test Label", // Added label
        2, // failure_threshold
        2, // success_threshold
        new anchor.BN(2) // timeout_seconds
      )
      .accounts({
        authority: authority.publicKey,
      })
      .rpc();

    const circuitAccount = await program.account.circuit.fetch(circuitPda);
    expect(Buffer.from(circuitAccount.name as number[]).toString().replace(/\0/g, '')).to.equal(circuitName);
    expect(Buffer.from(circuitAccount.label as number[]).toString().replace(/\0/g, '')).to.equal("Test Label");
    expect(circuitAccount.state).to.have.property("closed");
  });

  it("Updates a circuit label", async () => {
    await program.methods
      .updateCircuitLabel("New Label")
      .accounts({
        authority: authority.publicKey,
        circuit: circuitPda,
      })
      .rpc();

    const circuitAccount = await program.account.circuit.fetch(circuitPda);
    expect(Buffer.from(circuitAccount.label as number[]).toString().replace(/\0/g, '')).to.equal("New Label");
  });

  it("Trips the circuit after threshold failures", async () => {
    // Record 1st failure
    await program.methods.recordFailure().accounts({ circuit: circuitPda }).rpc();
    let circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("closed");
    expect(circuit.consecutiveFailures).to.equal(1);

    // Record 2nd failure -> Trips
    await program.methods.recordFailure().accounts({ circuit: circuitPda }).rpc();
    circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("open");
  });

  it("Blocks calls when Open", async () => {
    try {
      await program.methods.checkState().accounts({ circuit: circuitPda }).rpc();
      expect.fail("Should have blocked");
    } catch (err: any) {
      expect(err.error.errorCode.code).to.equal("CircuitOpen");
    }
  });

  it("Transitions to HalfOpen after timeout", async () => {
    // Wait for timeout (2s)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // checkState should now transition to HalfOpen and succeed
    await program.methods.checkState().accounts({ circuit: circuitPda }).rpc();
    
    const circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("halfOpen");
  });

  it("Recovers to Closed after threshold successes", async () => {
    // Record 1st success
    await program.methods.recordSuccess().accounts({ circuit: circuitPda }).rpc();
    let circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("halfOpen");

    // Record 2nd success -> Closes
    await program.methods.recordSuccess().accounts({ circuit: circuitPda }).rpc();
    circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("closed");
  });

  it("Can be force-opened by authority", async () => {
    await program.methods
      .forceOpen()
      .accounts({
        authority: authority.publicKey,
        circuit: circuitPda,
      })
      .rpc();

    const circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("open");
  });

  it("Can be reset by authority", async () => {
    await program.methods
      .resetCircuit()
      .accounts({
        authority: authority.publicKey,
        circuit: circuitPda,
      })
      .rpc();

    const circuit = await program.account.circuit.fetch(circuitPda);
    expect(circuit.state).to.have.property("closed");
    expect(circuit.consecutiveFailures).to.equal(0);
  });
});
