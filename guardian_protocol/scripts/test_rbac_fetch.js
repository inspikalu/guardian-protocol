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
  const idl = JSON.parse(fs.readFileSync('./target/idl/rbac.json', 'utf8'));
  
  // Patch IDL
  const roleType = idl.types?.find(t => t.name === "Role");
  if (roleType && roleType.type.fields) {
    const nameField = roleType.type.fields.find(f => f.name === "name");
    if (nameField) {
      nameField.type = { array: ["u8", 32] };
    }
  }

  const program = new anchor.Program(idl, provider);

  try {
    console.log("Fetching roles...");
    const roles = await program.account.role.all();
    console.log("Roles fetched:", roles.length);
  } catch (err) {
    console.error("Error fetching roles:", err);
  }

  try {
    console.log("Fetching assignments...");
    const assignments = await program.account.roleAssignment.all();
    console.log("Assignments fetched:", assignments.length);
  } catch (err) {
    console.error("Error fetching assignments:", err);
  }

  try {
    console.log("Fetching logs...");
    const logs = await program.account.auditLog.all();
    console.log("Logs fetched:", logs.length);
  } catch (err) {
    console.error("Error fetching logs:", err);
  }
}

main().catch(console.error);
