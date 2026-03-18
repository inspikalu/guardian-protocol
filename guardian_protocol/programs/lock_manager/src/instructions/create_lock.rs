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

    let mutable_lock = &mut ctx.accounts.lock;
    let mut res_arr = [0u8; 64];
    res_arr[..resource_id.len()].copy_from_slice(resource_id.as_bytes());
    mutable_lock.resource_id = res_arr;
    
    mutable_lock.state = LockState::Available;
    mutable_lock.authority = ctx.accounts.authority.key();
    mutable_lock.owner = None;
    mutable_lock.acquired_at = None;
    mutable_lock.expires_at = None;
    mutable_lock.max_lease_duration = max_lease_duration;
    mutable_lock.allow_reentrancy = allow_reentrancy;
    mutable_lock.reentrancy_count = 0;
    mutable_lock.total_acquisitions = 0;
    mutable_lock.total_contentions = 0;
    mutable_lock.bump = ctx.bumps.lock;

    msg!("Lock created: {}", resource_id);
    Ok(())
}
