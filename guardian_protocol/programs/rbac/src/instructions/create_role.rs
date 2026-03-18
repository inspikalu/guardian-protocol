use anchor_lang::prelude::*;
use crate::state::{Authority, Role, Permission};
use crate::errors::RbacError;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateRole<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [AUTHORITY_SEED],
        bump = authority.bump,
        constraint = authority.admin == admin.key() @ RbacError::Unauthorized,
    )]
    pub authority: Account<'info, Authority>,

    #[account(
        init,
        payer = admin,
        space = 8 + Role::INIT_SPACE,
        seeds = [ROLE_SEED, name.as_bytes()],
        bump,
    )]
    pub role: Account<'info, Role>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateRole>,
    name: String,
    permissions: Vec<Permission>,
    parent_role: Option<Pubkey>,
    expiry: Option<i64>,
) -> Result<()> {
    require!(name.len() <= 32, RbacError::NameTooLong);

    let role = &mut ctx.accounts.role;
    let clock = Clock::get()?;

    let mut name_arr = [0u8; 32];
    name_arr[..name.len()].copy_from_slice(name.as_bytes());
    role.name = name_arr;

    let mut perms_arr = [Permission::None; 10];
    for (i, p) in permissions.into_iter().enumerate() {
        if i < 10 {
            perms_arr[i] = p;
        }
    }
    role.permissions = perms_arr;

    role.parent_role = parent_role;
    role.created_by = ctx.accounts.admin.key();
    role.created_at = clock.unix_timestamp;
    role.expires_at = expiry;
    role.bump = ctx.bumps.role;

    msg!("Role created by {}", role.created_by);
    Ok(())
}
