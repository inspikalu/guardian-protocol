use anchor_lang::prelude::*;
use crate::state::{DistributedLock, LockState};
use crate::errors::LockError;

#[derive(Accounts)]
pub struct ForceUnlock<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = lock.authority == authority.key() @ LockError::Unauthorized,
    )]
    pub lock: Account<'info, DistributedLock>,
}

pub fn handler(ctx: Context<ForceUnlock>) -> Result<()> {
    let lock = &mut ctx.accounts.lock;

    lock.state = LockState::Available;
    lock.owner = None;
    lock.acquired_at = None;
    lock.expires_at = None;
    lock.reentrancy_count = 0;

    msg!(
        "Lock force-unlocked by authority {}",
        ctx.accounts.authority.key()
    );
    Ok(())
}
