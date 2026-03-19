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
  const rbacProgram = new anchor.Program(idl, provider);
  const PROGRAM_IDS = { rbac: rbacProgram.programId };

  try {
      console.log("Starting fetch...");
      const [allAssignments, allLogs, rawAccounts] = await Promise.all([
        rbacProgram.account.roleAssignment.all(),
        rbacProgram.account.auditLog.all(),
        connection.getProgramAccounts(PROGRAM_IDS.rbac)
      ]);

      const ROLE_DISC = Buffer.from([46, 219, 197, 24, 233, 249, 253, 154]);
      
      const decodeRoleAccount = (pubkey, data) => {
        try {
          let offset = 8;
          const nameLen = data.readUInt32LE(offset);
          offset += 4;
          const name = data.slice(offset, offset + nameLen).toString('utf8');
          offset += nameLen;

          const permissionsLen = data.readUInt32LE(offset);
          console.log(`Buffer length: ${data.length}, Permissions Len: ${permissionsLen}`);
          offset += 4;
          const permissions = [];
          for (let i = 0; i < permissionsLen; i++) {
            const variant = data.readUInt8(offset);
            console.log(`Permission ${i}: variant=${variant}, offset=${offset}`);
            offset += 1;
            if (variant === 0) {
              const maxAmount = new anchor.BN(data.slice(offset, offset + 8), 'le');
              offset += 8;
              permissions.push({ treasuryWithdraw: { maxAmount } });
            } else if (variant === 1) { permissions.push({ treasuryDeposit: {} }); }
            else if (variant === 2) { permissions.push({ roleManagement: {} }); }
            else if (variant === 3) { permissions.push({ emergencyStop: {} }); }
            else if (variant === 4) { permissions.push({ viewAudit: {} }); }
            else if (variant === 5) { permissions.push({ acquireLock: {} }); }
            else console.log(`UNKNOWN VARIANT ${variant}`);
          }

          console.log(`Finished permissions. Offset is now ${offset}, buffer remaining: ${data.length - offset}`);
          let parentRole = null;
          if (data.readUInt8(offset) === 1) {
            parentRole = new PublicKey(data.slice(offset + 1, offset + 33));
          }
          offset += 33;

          const createdBy = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          const createdAt = new anchor.BN(data.slice(offset, offset + 8), 'le');
          offset += 8;

          let expiresAt = null;
          if (data.readUInt8(offset) === 1) {
            expiresAt = new anchor.BN(data.slice(offset + 1, offset + 9), 'le');
          }
          offset += 9;

          return {
            publicKey: pubkey,
            account: { name, permissions, parentRole, createdBy, createdAt, expiresAt }
          };
        } catch (e) { 
          console.error("Decode dropped a Role account:", e);
          return null; 
        }
      };

      const allRoles = rawAccounts
        .filter(a => a.account.data.slice(0, 8).equals(ROLE_DISC))
        .map(a => decodeRoleAccount(a.pubkey, a.account.data))
        .filter(Boolean);
        
      console.log('Successfully decoded roles:', allRoles.length);

      const [authorityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("authority")],
        rbacProgram.programId
      );
      const authority = await rbacProgram.account.authority.fetch(authorityPda);
      
      console.log('Successfully fetched authority:', authority.admin.toString());
      
      console.log('All succeed!');
  } catch (err) {
      console.error("Caught error in try block:", err);
  }
}

main().catch(console.error);
