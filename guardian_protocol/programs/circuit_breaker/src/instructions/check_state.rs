use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState};
use crate::errors::CircuitError;

#[derive(Accounts)]
pub struct CheckState<'info> {
    #[account(mut)]
    pub circuit: Account<'info, Circuit>,
}

pub fn handler(ctx: Context<CheckState>) -> Result<()> {
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    // If Open, check whether the timeout has elapsed → transition to HalfOpen
    if circuit.state == CircuitState::Open {
        let elapsed = clock.unix_timestamp.saturating_sub(circuit.last_state_change);
        if elapsed >= circuit.timeout_seconds {
            // Allow probe: transition to HalfOpen
            circuit.state = CircuitState::HalfOpen;
            circuit.consecutive_failures = 0;
            circuit.consecutive_successes = 0;
            circuit.last_state_change = clock.unix_timestamp;
            msg!("Circuit transitioned: Open → HalfOpen (timeout elapsed)");
            // In HalfOpen we allow the call through — do NOT error here.
        } else {
            // Still within timeout window — block calls
            return err!(CircuitError::CircuitOpen);
        }
    }

    // Closed or HalfOpen: allow through
    msg!("Circuit is healthy — call permitted");
    Ok(())
}
