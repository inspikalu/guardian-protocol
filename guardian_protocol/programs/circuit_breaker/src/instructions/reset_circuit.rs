use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState};
use crate::errors::CircuitError;

#[derive(Accounts)]
pub struct ResetCircuit<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = circuit.authority == authority.key() @ CircuitError::Unauthorized,
    )]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<ResetCircuit>) -> Result<()> {
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    circuit.state = CircuitState::Closed;
    circuit.consecutive_failures = 0;
    circuit.consecutive_successes = 0;
    circuit.last_state_change = clock.unix_timestamp;

    msg!("Circuit '{}' reset to Closed by authority", circuit.name);
    Ok(())
}
