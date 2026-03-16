use anchor_lang::prelude::*;
use crate::state::{Role, RoleAssignment};
use crate::errors::RbacError;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct GrantRole<'info> {
    #[account(mut)]
    pub granter: Signer<'info>,

    pub role: Account<'info, Role>,

    #[account(
        init,
        payer = granter,
        space = 8 + RoleAssignment::INIT_SPACE,
        seeds = [ASSIGNMENT_SEED, user.as_ref(), role.key().as_ref()],
        bump,
    )]
    pub assignment: Account<'info, RoleAssignment>,

    /// Optional: The granter's own assignment, used to verify delegation rights.
    /// Must be passed when the granter is NOT the authority admin.
    pub granter_assignment: Option<Account<'info, RoleAssignment>>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<GrantRole>,
    user: Pubkey,
    expiry: Option<i64>,
    can_delegate: bool,
) -> Result<()> {
    let clock = Clock::get()?;

    // If the role itself has an expiry, it must still be valid.
    if let Some(role_expiry) = ctx.accounts.role.expires_at {
        require!(clock.unix_timestamp < role_expiry, RbacError::RoleExpired);
    }

    // If delegating on behalf of someone else, verify delegation rights.
    let delegation_depth = if let Some(granter_assignment) = &ctx.accounts.granter_assignment {
        require!(granter_assignment.can_delegate, RbacError::PermissionDenied);
        require!(
            granter_assignment.delegation_depth < MAX_DELEGATION_DEPTH,
            RbacError::DelegationDepthExceeded
        );
        granter_assignment.delegation_depth + 1
    } else {
        0
    };

    let assignment = &mut ctx.accounts.assignment;
    assignment.user = user;
    assignment.role = ctx.accounts.role.key();
    assignment.granted_by = ctx.accounts.granter.key();
    assignment.granted_at = clock.unix_timestamp;
    assignment.expires_at = expiry;
    assignment.can_delegate = can_delegate;
    assignment.delegation_depth = delegation_depth;
    assignment.bump = ctx.bumps.assignment;

    msg!("Role assigned to {}", user);
    Ok(())
}
