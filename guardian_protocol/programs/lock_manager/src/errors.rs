use anchor_lang::prelude::*;

#[error_code]
pub enum LockError {
    #[msg("The lock is already held by another owner")]
    LockAlreadyAcquired,
    #[msg("The caller is not the lock owner")]
    NotLockOwner,
    #[msg("The lock lease has expired")]
    LockExpired,
    #[msg("Only the lock authority can perform this action")]
    Unauthorized,
    #[msg("Resource ID is too long (max 64 chars)")]
    ResourceIdTooLong,
    #[msg("The requested lease duration exceeds the maximum")]
    LeaseTooLong,
    #[msg("Reentrancy is not allowed for this lock")]
    ReentrancyNotAllowed,
}
