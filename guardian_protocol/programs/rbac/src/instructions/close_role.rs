use anchor_lang::prelude::*;
use crate::state::Authority;
use crate::errors::RbacError;
use crate::constants::*;

#[derive(Accounts)]
pub struct CloseRole<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [AUTHORITY_SEED],
        bump = authority.bump,
        constraint = authority.admin == admin.key() @ RbacError::Unauthorized,
    )]
    pub authority: Account<'info, Authority>,

    /// CHECK: Manual seed and owner validation in handler
    #[account(mut)]
    pub role: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CloseRole>, role_name: String) -> Result<()> {
    let seeds = [ROLE_SEED, role_name.as_bytes()];
    let (expected_pda, _bump) = Pubkey::find_program_address(&seeds, ctx.program_id);
    
    if ctx.accounts.role.key() != expected_pda {
        return Err(ProgramError::InvalidSeeds.into());
    }

    let dest = ctx.accounts.admin.to_account_info();
    let source = ctx.accounts.role.to_account_info();

    let dest_starting_lamports = dest.lamports();
    **dest.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(source.lamports())
        .unwrap();
    **source.lamports.borrow_mut() = 0;

    let mut source_data = source.data.borrow_mut();
    source_data.fill(0);

    msg!("Role '{}' closed by admin", role_name);
    Ok(())
}
