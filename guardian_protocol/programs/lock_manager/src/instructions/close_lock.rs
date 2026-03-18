use anchor_lang::prelude::*;
use crate::state::DistributedLock;
use crate::errors::LockError;

#[derive(Accounts)]
pub struct CloseLock<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Manual seed validation in handler
    #[account(mut)]
    pub lock: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CloseLock>, resource_id: String) -> Result<()> {
    let seeds = [b"lock", resource_id.as_bytes()];
    let (expected_pda, _bump) = Pubkey::find_program_address(&seeds, ctx.program_id);
    
    if ctx.accounts.lock.key() != expected_pda {
        return Err(ProgramError::InvalidSeeds.into());
    }

    let dest = ctx.accounts.authority.to_account_info();
    let source = ctx.accounts.lock.to_account_info();

    let dest_starting_lamports = dest.lamports();
    **dest.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(source.lamports())
        .unwrap();
    **source.lamports.borrow_mut() = 0;

    let mut source_data = source.data.borrow_mut();
    source_data.fill(0);

    msg!("Lock '{}' closed by authority", resource_id);
    Ok(())
}
