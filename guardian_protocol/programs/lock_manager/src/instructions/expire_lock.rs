use anchor_lang::prelude::*;
use crate::state::{DistributedLock, LockState};
use crate::errors::LockError;

#[derive(Accounts)]
pub struct ExpireLock<'info> {
    /// Permissionless: anyone can call this to clean up an expired lock.
    pub caller: Signer<'info>,

    #[account(mut)]
    pub lock: Account<'info, DistributedLock>,
}

pub fn handler(ctx: Context<ExpireLock>) -> Result<()> {
    let clock = Clock::get()?;
    let lock = &mut ctx.accounts.lock;

    // Must currently be Locked to transition to Expired
    require!(lock.state == LockState::Locked, LockError::LockAlreadyAcquired);

    let expires_at = lock.expires_at.unwrap_or(i64::MAX);
    require!(
        clock.unix_timestamp > expires_at,
        LockError::NotLockOwner // reusing error — means "lock is still valid"
    );

    lock.state = LockState::Expired;
    lock.owner = None;
    lock.acquired_at = None;
    lock.expires_at = None;
    lock.reentrancy_count = 0;

    msg!("Lock '{}' expired and cleaned up", lock.resource_id);
    Ok(())
}
