import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Rbac } from "../target/types/rbac";
import { expect } from "chai";

describe("rbac", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Rbac as Program<Rbac>;
  const admin = provider.wallet;

  const airdrop = async (pubkey: anchor.web3.PublicKey) => {
    const signature = await provider.connection.requestAirdrop(pubkey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
  };

  const authoritySeeds = [Buffer.from("authority")];
  const [authorityPda] = anchor.web3.PublicKey.findProgramAddressSync(
    authoritySeeds,
    program.programId
  );

  it("Initializes authority (idempotent)", async () => {
    try {
      await program.methods
        .initializeAuthority()
        .accounts({
          admin: admin.publicKey,
        })
        .rpc();
    } catch (e: any) {
        // If already initialized, just verify it exists
        const authorityAccount = await program.account.authority.fetch(authorityPda);
        expect(authorityAccount.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    }
  });

  it("Creates a role", async () => {
    const roleName = "test-role-" + Date.now(); // Unique name
    const [rolePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("role"), Buffer.from(roleName)],
      program.programId
    );

    const permissions = [
      { treasuryWithdraw: { maxAmount: new anchor.BN(1000) } },
      { treasuryDeposit: {} },
    ];

    await program.methods
      .createRole(roleName, permissions, null, null)
      .accounts({
        admin: admin.publicKey,
      })
      .rpc();

    const roleAccount = await program.account.role.fetch(rolePda);
    expect(Buffer.from(roleAccount.name as number[]).toString().replace(/\0/g, '')).to.equal(roleName);
  });

  it("Grants a role to a user", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);
    
    const roleName = "grant-role-" + Date.now();
    const [rolePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("role"), Buffer.from(roleName)],
      program.programId
    );

    await program.methods.createRole(roleName, [], null, null).accounts({admin: admin.publicKey}).rpc();

    await program.methods
      .grantRole(user.publicKey, null, true)
      .accounts({
        granter: admin.publicKey,
        role: rolePda,
        granterAssignment: null, // Explicitly pass null for optional account
      })
      .rpc();

    const [assignmentPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("assignment"), user.publicKey.toBuffer(), rolePda.toBuffer()],
      program.programId
    );
    const assignmentAccount = await program.account.roleAssignment.fetch(assignmentPda);
    expect(assignmentAccount.user.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("Checks permission", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(user.publicKey);

    const roleName = "check-perm-role-" + Date.now();
    const [rolePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("role"), Buffer.from(roleName)],
      program.programId
    );

    await program.methods.createRole(roleName, [{ treasuryDeposit: {} }], null, null).accounts({admin: admin.publicKey}).rpc();

    await program.methods
      .grantRole(user.publicKey, null, false)
      .accounts({
        granter: admin.publicKey,
        role: rolePda,
        granterAssignment: null,
      })
      .rpc();

    await program.methods
      .checkPermission({ treasuryDeposit: {} })
      .accounts({
        user: user.publicKey,
        role: rolePda,
      })
      .signers([user])
      .rpc();
  });
});
