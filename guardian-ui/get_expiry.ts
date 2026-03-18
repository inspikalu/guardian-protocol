import * as anchor from "@coral-xyz/anchor";
// @ts-nocheck
import { PublicKey, Connection } from "@solana/web3.js";
import fs from "fs";

// Parse IDL
const idl = JSON.parse(fs.readFileSync("/home/inspiuser/Desktop/bounties/production-systems/guardian_protocol/target/idl/rbac.json", "utf8"));

const connection = new Connection("https://api.devnet.solana.com", "confirmed");
const programId = new PublicKey("HtnQkQeA1yv7X8gExGg16SgQy1a1wCHzHq4o4gK73yF6"); // from PROGRAM_IDS.rbac? I need to check PROGRAM_IDS

// Actually, let me use the repo's anchor setup.
