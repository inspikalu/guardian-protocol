use anchor_lang::prelude::*;
use crate::state::{Role, RoleAssignment, Permission};
use crate::errors::RbacError;
use crate::constants::*;

#[derive(Accounts)]
pub struct CheckPermission<'info> {
    pub user: Signer<'info>,

    pub role: Account<'info, Role>,

    #[account(
        seeds = [ASSIGNMENT_SEED, user.key().as_ref(), role.key().as_ref()],
        bump = assignment.bump,
        constraint = assignment.user == user.key() @ RbacError::PermissionDenied,
        constraint = assignment.role == role.key() @ RbacError::PermissionDenied,
    )]
    pub assignment: Account<'info, RoleAssignment>,
}

pub fn handler(
    ctx: Context<CheckPermission>,
    required_permission: Permission,
) -> Result<()> {
    let clock = Clock::get()?;

    // Check role expiry
    if let Some(role_expiry) = ctx.accounts.role.expires_at {
        require!(clock.unix_timestamp < role_expiry, RbacError::RoleExpired);
    }

    // Check assignment expiry
    if let Some(assignment_expiry) = ctx.accounts.assignment.expires_at {
        require!(clock.unix_timestamp < assignment_expiry, RbacError::AssignmentExpired);
    }

    // Check the required permission exists in the role
    let has_permission = ctx.accounts.role.permissions.iter().any(|p| {
        // For TreasuryWithdraw, check the max_amount constraint
        match (&required_permission, p) {
            (
                Permission::TreasuryWithdraw { max_amount: required_max },
                Permission::TreasuryWithdraw { max_amount: role_max },
            ) => required_max <= role_max,
            (a, b) => a == b,
        }
    });

    require!(has_permission, RbacError::PermissionDenied);

    msg!(
        "Permission check passed for user {}",
        ctx.accounts.user.key()
    );
    Ok(())
}
