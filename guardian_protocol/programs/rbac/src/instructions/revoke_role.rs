use anchor_lang::prelude::*;
use crate::state::{Authority, RoleAssignment};
use crate::errors::RbacError;
use crate::constants::*;

#[derive(Accounts)]
pub struct RevokeRole<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [AUTHORITY_SEED],
        bump = authority.bump,
        constraint = authority.admin == admin.key() @ RbacError::Unauthorized,
    )]
    pub authority: Account<'info, Authority>,

    #[account(
        mut,
        close = admin,
    )]
    pub assignment: Account<'info, RoleAssignment>,
}

pub fn handler(ctx: Context<RevokeRole>) -> Result<()> {
    msg!(
        "Role assignment revoked for user {} by admin {}",
        ctx.accounts.assignment.user,
        ctx.accounts.admin.key()
    );
    Ok(())
}
