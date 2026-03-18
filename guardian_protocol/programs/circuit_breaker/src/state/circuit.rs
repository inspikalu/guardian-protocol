use anchor_lang::prelude::*;

pub const CIRCUIT_SEED: &[u8] = b"circuit";

/// The state machine of a circuit breaker.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum CircuitState {
    /// Normal operation — calls flow through.
    Closed,
    /// Failure threshold exceeded — calls are blocked.
    Open,
    /// Test mode after timeout — one probe call is allowed to check for recovery.
    HalfOpen,
}

/// The on-chain circuit breaker account.
#[account]
#[derive(InitSpace)]
pub struct Circuit {
    /// Unique name of the resource being protected (e.g., "oracle_program")
    pub name: [u8; 32],
    /// Human-readable label for the circuit.
    pub label: [u8; 64],
    pub state: CircuitState,
    /// The authority who can force-open or reset the circuit.
    pub authority: Pubkey,

    // --- Configuration (set once at creation) ---
    /// Number of consecutive failures before opening.
    pub failure_threshold: u32,
    /// Number of consecutive successes in HalfOpen before closing.
    pub success_threshold: u32,
    /// Seconds to wait in Open state before transitioning to HalfOpen.
    pub timeout_seconds: i64,

    // --- Runtime Metrics ---
    pub total_calls: u64,
    pub consecutive_failures: u32,
    pub consecutive_successes: u32,
    pub last_failure_time: i64,
    pub last_state_change: i64,

    // --- Lifetime Statistics ---
    pub lifetime_failures: u64,
    pub lifetime_successes: u64,

    pub bump: u8,
}
