import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { IDL as RbacIdl } from "./idls/rbac";
import { IDL as CircuitsIdl } from "./idls/circuit_breaker";
import { IDL as LocksIdl } from "./idls/lock_manager";
import { IDL as OrchestratorIdl } from "./idls/orchestrator";

// These matches Anchor.toml
export const PROGRAM_IDS = {
  rbac: new PublicKey("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS"),
  circuits: new PublicKey("9GXUR2xcVDxnu1JNEdDqCrLRL9K44t5iYxcTWekMaPma"),
  locks: new PublicKey("reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j"),
  orchestrator: new PublicKey("X61sTdLaXMaAjdDE9UFSs36FoabSQMiXGS2uABzeJjB"),
};

export function getAnchorProvider(connection: Connection, wallet: any) {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

export function getRbacProgram(provider: AnchorProvider) {
  return new Program(RbacIdl as any, provider);
}

export function getCircuitsProgram(provider: AnchorProvider) {
  return new Program(CircuitsIdl as any, provider);
}

export function getLocksProgram(provider: AnchorProvider) {
  return new Program(LocksIdl as any, provider);
}

export function getOrchestratorProgram(provider: AnchorProvider) {
  return new Program(OrchestratorIdl as any, provider);
}
