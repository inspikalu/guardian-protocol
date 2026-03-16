use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState};
use crate::errors::CircuitError;

#[derive(Accounts)]
pub struct ForceOpen<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = circuit.authority == authority.key() @ CircuitError::Unauthorized,
    )]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<ForceOpen>) -> Result<()> {
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    circuit.state = CircuitState::Open;
    circuit.last_state_change = clock.unix_timestamp;
    circuit.consecutive_failures = 0;
    circuit.consecutive_successes = 0;

    msg!("Circuit '{}' force-opened by authority {}", circuit.name, ctx.accounts.authority.key());
    Ok(())
}
