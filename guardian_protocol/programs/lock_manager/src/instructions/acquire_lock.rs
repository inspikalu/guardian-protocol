use anchor_lang::prelude::*;
use crate::state::{DistributedLock, LockReceipt, LockState, RECEIPT_SEED};
use crate::errors::LockError;

#[derive(Accounts)]
pub struct AcquireLock<'info> {
    #[account(mut)]
    pub acquirer: Signer<'info>,

    #[account(mut)]
    pub lock: Account<'info, DistributedLock>,

    #[account(
        init_if_needed,
        payer = acquirer,
        space = 8 + LockReceipt::INIT_SPACE,
        seeds = [RECEIPT_SEED, lock.key().as_ref(), acquirer.key().as_ref()],
        bump,
    )]
    pub receipt: Account<'info, LockReceipt>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AcquireLock>, lease_duration: i64) -> Result<()> {
    let clock = Clock::get()?;

    // Cache values needed later before taking a mutable borrow.
    let lock_key = ctx.accounts.lock.key();
    let acquirer_key = ctx.accounts.acquirer.key();

    let lock = &mut ctx.accounts.lock;

    require!(
        lease_duration <= lock.max_lease_duration,
        LockError::LeaseTooLong
    );

    // Handle reentrancy
    if lock.state == LockState::Locked {
        if lock.owner == Some(acquirer_key) {
            require!(lock.allow_reentrancy, LockError::ReentrancyNotAllowed);
            lock.reentrancy_count = lock.reentrancy_count.saturating_add(1);
            msg!("Lock '{}' re-acquired (depth {})", lock.resource_id, lock.reentrancy_count);
            return Ok(());
        }
        // Lock is held by someone else
        lock.total_contentions = lock.total_contentions.saturating_add(1);
        return err!(LockError::LockAlreadyAcquired);
    }

    let expires_at = clock.unix_timestamp.checked_add(lease_duration).unwrap_or(i64::MAX);

    lock.state = LockState::Locked;
    lock.owner = Some(acquirer_key);
    lock.acquired_at = Some(clock.unix_timestamp);
    lock.expires_at = Some(expires_at);
    lock.reentrancy_count = 0;
    lock.total_acquisitions = lock.total_acquisitions.saturating_add(1);

    let resource_id = lock.resource_id.clone();

    let receipt = &mut ctx.accounts.receipt;
    receipt.lock = lock_key;
    receipt.owner = acquirer_key;
    receipt.acquired_at = clock.unix_timestamp;
    receipt.lease_expires = expires_at;
    receipt.bump = ctx.bumps.receipt;

    msg!(
        "Lock '{}' acquired by {} until {}",
        resource_id,
        acquirer_key,
        expires_at
    );
    Ok(())
}
