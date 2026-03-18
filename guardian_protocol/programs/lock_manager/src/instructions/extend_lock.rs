use anchor_lang::prelude::*;
use crate::state::DistributedLock;
use crate::errors::LockError;

#[derive(Accounts)]
pub struct ExtendLock<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = lock.owner == Some(owner.key()) @ LockError::NotLockOwner,
    )]
    pub lock: Account<'info, DistributedLock>,
}

pub fn handler(ctx: Context<ExtendLock>, additional_seconds: i64) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    let current_expiry = lock.expires_at.unwrap_or(0);
    let new_expiry = current_expiry.checked_add(additional_seconds).unwrap_or(i64::MAX);

    // Ensure the total lease doesn't exceed max
    let acquired_at = lock.acquired_at.unwrap_or(0);
    let total_duration = new_expiry.saturating_sub(acquired_at);
    require!(total_duration <= lock.max_lease_duration, LockError::LeaseTooLong);

    lock.expires_at = Some(new_expiry);
    msg!("Lock extended to {}", new_expiry);
    Ok(())
}
