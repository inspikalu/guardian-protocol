use anchor_lang::prelude::*;
use crate::state::{Circuit, CIRCUIT_SEED};
use crate::errors::CircuitError;

#[derive(Accounts)]
pub struct CloseCircuit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Manual seed validation in handler
    #[account(mut)]
    pub circuit: AccountInfo<'info>,
}

pub fn handler(ctx: Context<CloseCircuit>, name: String) -> Result<()> {
    let seeds = [CIRCUIT_SEED, name.as_bytes()];
    let (expected_pda, _bump) = Pubkey::find_program_address(&seeds, ctx.program_id);
    
    if ctx.accounts.circuit.key() != expected_pda {
        return Err(ProgramError::InvalidSeeds.into());
    }

    let dest = ctx.accounts.authority.to_account_info();
    let source = ctx.accounts.circuit.to_account_info();

    let dest_starting_lamports = dest.lamports();
    **dest.lamports.borrow_mut() = dest_starting_lamports
        .checked_add(source.lamports())
        .unwrap();
    **source.lamports.borrow_mut() = 0;

    let mut source_data = source.data.borrow_mut();
    source_data.fill(0);

    msg!("Circuit '{}' closed by authority", name);
    Ok(())
}
