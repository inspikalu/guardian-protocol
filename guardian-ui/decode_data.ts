
// @ts-nocheck
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";

const rbacIdl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian-ui/src/lib/anchor/idls/rbac.json", "utf8"));
const program = new anchor.Program(rbacIdl, { connection: { commitment: "confirmed" } } as any);

const data1 = "zYK/59Phm/aNG830Ztsz9l6aiU7lq5+W0lSzoaB/uQEE0xSBFir/36dlUYVXI/CTLJa53IuOdUeQ6dNqMUIJRZPXDGg0idHVDt2xqW315WALgtztohBPVj4KoPjHw9ByGRXi4uXXxLwZxLdpAAAAAAAAAP8AAAAAAAAAAA==";
const data2 = "zYK/59Phm/ZjwjLLB5dnWlxQSF+QAZyFRooLI3+CTfsB3EH/MEkP+qdlUYVXI/CTLJa53IuOdUeQ6dNqMUIJRZPXDGg0idHVDt2xqW315WALgtztohBPVj4KoPjHw9ByGRXi4uXXxLyl0rdpAAAAAAEdJLlpAAAAAAAA/Q==";
const data3 = "zYK/59Phm/YO3bGpbfXlYAuC3O2iEE9WPgqg+MfD0HIZFeLi5dfEvHr2smcYR9ndWiN/9joNf4xXdw7IwEDUaabscRsotGkiDt2xqW315WALgtztohBPVj4KoPjHw9ByGRXi4uXXxLxdvrdpAAAAAAABAPoAAAAAAAAAAA==";

[data1, data2, data3].forEach((d, i) => {
    const buf = Buffer.from(d, 'base64');
    try {
        const decoded = program.coder.accounts.decode("RoleAssignment", buf);
        console.log(`--- Assignment ${i+1} ---`);
        console.log("User:", decoded.user.toBase58());
        console.log("Role:", decoded.role.toBase58());
        if (decoded.expiresAt) {
            const date = new Date(decoded.expiresAt.toNumber() * 1000);
            console.log("ExpiresAt:", decoded.expiresAt.toString(), "(", date.toUTCString(), ")");
        } else {
            console.log("ExpiresAt: Permanent");
        }
    } catch (e: any) {
        console.log(`--- Assignment ${i+1} error:`, e.message);
    }
});
