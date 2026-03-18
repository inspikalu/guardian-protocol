use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState};

#[derive(Accounts)]
pub struct RecordFailure<'info> {
    #[account(mut)]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<RecordFailure>) -> Result<()> {
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    circuit.total_calls = circuit.total_calls.saturating_add(1);
    circuit.lifetime_failures = circuit.lifetime_failures.saturating_add(1);
    circuit.consecutive_successes = 0;
    circuit.consecutive_failures = circuit.consecutive_failures.saturating_add(1);
    circuit.last_failure_time = clock.unix_timestamp;

    // Transition Closed or HalfOpen → Open on threshold breach
    if circuit.state != CircuitState::Open
        && circuit.consecutive_failures >= circuit.failure_threshold
    {
        circuit.state = CircuitState::Open;
        circuit.consecutive_failures = 0;
        circuit.last_state_change = clock.unix_timestamp;
        msg!("Circuit OPENED after threshold breach");
    }

    Ok(())
}
