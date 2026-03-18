use anchor_lang::prelude::*;
use crate::state::Circuit;
use crate::errors::CircuitError;

#[derive(Accounts)]
#[instruction(new_label: String)]
pub struct UpdateCircuitLabel<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority @ CircuitError::Unauthorized,
    )]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<UpdateCircuitLabel>, new_label: String) -> Result<()> {
    require!(new_label.len() <= 64, CircuitError::NameTooLong);
    
    let circuit = &mut ctx.accounts.circuit;
    
    let mut label_arr = [0u8; 64];
    label_arr[..new_label.len()].copy_from_slice(new_label.as_bytes());
    circuit.label = label_arr;

    msg!("Circuit label updated to '{}'", new_label);
    Ok(())
}
