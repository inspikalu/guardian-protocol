/// Maximum delegation chain depth to prevent infinite loops.
pub const MAX_DELEGATION_DEPTH: u8 = 3;

/// PDA seeds
pub const AUTHORITY_SEED: &[u8] = b"authority";
pub const ROLE_SEED: &[u8] = b"role";
pub const ASSIGNMENT_SEED: &[u8] = b"assignment";
pub const AUDIT_SEED: &[u8] = b"audit";
