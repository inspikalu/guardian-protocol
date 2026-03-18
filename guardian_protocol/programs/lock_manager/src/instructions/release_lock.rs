use anchor_lang::prelude::*;
use crate::state::{DistributedLock, LockReceipt, LockState};
use crate::errors::LockError;

#[derive(Accounts)]
pub struct ReleaseLock<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = lock.owner == Some(owner.key()) @ LockError::NotLockOwner,
    )]
    pub lock: Account<'info, DistributedLock>,

    #[account(
        mut,
        close = owner,
        seeds = [crate::state::RECEIPT_SEED, lock.key().as_ref(), owner.key().as_ref()],
        bump = receipt.bump,
    )]
    pub receipt: Account<'info, LockReceipt>,
}

pub fn handler(ctx: Context<ReleaseLock>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    // Handle reentrant release
    if lock.reentrancy_count > 0 {
        lock.reentrancy_count -= 1;
        msg!("Lock re-acquired (depth {})", lock.reentrancy_count);
        return Ok(());
    }

    lock.state = LockState::Available;
    lock.owner = None;
    lock.acquired_at = None;
    lock.expires_at = None;
    lock.reentrancy_count = 0;

    msg!("Lock released");
    Ok(())
}
