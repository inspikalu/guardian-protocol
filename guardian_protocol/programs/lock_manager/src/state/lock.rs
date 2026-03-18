use anchor_lang::prelude::*;

pub const LOCK_SEED: &[u8] = b"lock";
pub const RECEIPT_SEED: &[u8] = b"receipt";

/// The state of a distributed lock.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum LockState {
    /// No holder — free to acquire.
    Available,
    /// Actively held by an owner.
    Locked,
    /// Was locked, but the lease expired without an explicit release.
    Expired,
}

/// The on-chain distributed lock resource account.
#[account]
#[derive(InitSpace)]
pub struct DistributedLock {
    /// Unique identifier for the resource (e.g., "treasury_account")
    pub resource_id: [u8; 64],
    pub state: LockState,

    /// The authority who can force-unlock or administer this lock.
    pub authority: Pubkey,

    // --- Ownership ---
    pub owner: Option<Pubkey>,
    pub acquired_at: Option<i64>,
    pub expires_at: Option<i64>,

    // --- Configuration ---
    /// Maximum allowed lease duration in seconds.
    pub max_lease_duration: i64,

    // --- Reentrancy ---
    /// If true, the same owner can acquire multiple times (increments counter).
    pub allow_reentrancy: bool,
    pub reentrancy_count: u8,

    // --- Metrics ---
    pub total_acquisitions: u64,
    pub total_contentions: u64,

    pub bump: u8,
}

/// A receipt PDA proving the current holder's ownership (seeded by lock + owner).
#[account]
#[derive(InitSpace)]
pub struct LockReceipt {
    pub lock: Pubkey,
    pub owner: Pubkey,
    pub acquired_at: i64,
    pub lease_expires: i64,
    pub bump: u8,
}
