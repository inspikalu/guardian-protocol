use anchor_lang::prelude::*;

/// Permissions that can be assigned to a role.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum Permission {
    /// Allow treasury withdrawal up to a maximum lamport amount.
    TreasuryWithdraw { max_amount: u64 },
    /// Allow depositing into the treasury.
    TreasuryDeposit,
    /// Allow creating/managing roles.
    RoleManagement,
    /// Allow triggering emergency stops (force-open circuits).
    EmergencyStop,
    /// Allow viewing audit logs.
    ViewAudit,
    /// Allow acquiring distributed locks.
    AcquireLock,
    /// Sentinel for empty permission slots in fixed-size arrays.
    None,
}
