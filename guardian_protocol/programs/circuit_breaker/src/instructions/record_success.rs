use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState};

#[derive(Accounts)]
pub struct RecordSuccess<'info> {
    #[account(mut)]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<RecordSuccess>) -> Result<()> {
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    circuit.total_calls = circuit.total_calls.saturating_add(1);
    circuit.lifetime_successes = circuit.lifetime_successes.saturating_add(1);
    circuit.consecutive_failures = 0;
    circuit.consecutive_successes = circuit.consecutive_successes.saturating_add(1);

    // HalfOpen: if enough successes, transition back to Closed
    if circuit.state == CircuitState::HalfOpen
        && circuit.consecutive_successes >= circuit.success_threshold
    {
        circuit.state = CircuitState::Closed;
        circuit.consecutive_successes = 0;
        circuit.last_state_change = clock.unix_timestamp;
        msg!("Circuit transitioned: HalfOpen → Closed");
    }

    Ok(())
}
