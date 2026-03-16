use anchor_lang::prelude::*;
use crate::state::{DistributedLock, LockState, LOCK_SEED};
use crate::errors::LockError;

#[derive(Accounts)]
#[instruction(resource_id: String)]
pub struct CreateLock<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + DistributedLock::INIT_SPACE,
        seeds = [LOCK_SEED, resource_id.as_bytes()],
        bump,
    )]
    pub lock: Account<'info, DistributedLock>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateLock>,
    resource_id: String,
    max_lease_duration: i64,
    allow_reentrancy: bool,
) -> Result<()> {
    require!(resource_id.len() <= 64, LockError::ResourceIdTooLong);

    let lock = &mut ctx.accounts.lock;
    lock.resource_id = resource_id;
    lock.state = LockState::Available;
    lock.authority = ctx.accounts.authority.key();
    lock.owner = None;
    lock.acquired_at = None;
    lock.expires_at = None;
    lock.max_lease_duration = max_lease_duration;
    lock.allow_reentrancy = allow_reentrancy;
    lock.reentrancy_count = 0;
    lock.total_acquisitions = 0;
    lock.total_contentions = 0;
    lock.bump = ctx.bumps.lock;

    msg!("Lock '{}' created", lock.resource_id);
    Ok(())
}
