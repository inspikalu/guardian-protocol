use anchor_lang::prelude::*;
use crate::state::Authority;
use crate::constants::*;

#[derive(Accounts)]
pub struct InitializeAuthority<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Authority::INIT_SPACE,
        seeds = [AUTHORITY_SEED],
        bump,
    )]
    pub authority: Account<'info, Authority>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeAuthority>) -> Result<()> {
    let clock = Clock::get()?;
    let authority = &mut ctx.accounts.authority;

    authority.admin = ctx.accounts.admin.key();
    authority.created_at = clock.unix_timestamp;
    authority.bump = ctx.bumps.authority;

    msg!("Authority initialized with admin: {}", authority.admin);
    Ok(())
}
