use anchor_lang::prelude::*;
use crate::state::{Circuit, CircuitState, CIRCUIT_SEED};
use crate::errors::CircuitError;

#[derive(Accounts)]
#[instruction(name: String, label: String)]
pub struct CreateCircuit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Circuit::INIT_SPACE,
        seeds = [CIRCUIT_SEED, name.as_bytes()],
        bump,
    )]
    pub circuit: Account<'info, Circuit>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateCircuit>,
    name: String,
    label: String,
    failure_threshold: u32,
    success_threshold: u32,
    timeout_seconds: i64,
) -> Result<()> {
    require!(name.len() <= 32, CircuitError::NameTooLong);
    require!(label.len() <= 64, CircuitError::NameTooLong); // Reusing error for now or add new one
    let clock = Clock::get()?;
    let circuit = &mut ctx.accounts.circuit;

    let mut name_arr = [0u8; 32];
    name_arr[..name.len()].copy_from_slice(name.as_bytes());
    circuit.name = name_arr;

    let mut label_arr = [0u8; 64];
    label_arr[..label.len()].copy_from_slice(label.as_bytes());
    circuit.label = label_arr;

    circuit.state = CircuitState::Closed;
    circuit.authority = ctx.accounts.authority.key();
    circuit.failure_threshold = failure_threshold;
    circuit.success_threshold = success_threshold;
    circuit.timeout_seconds = timeout_seconds;
    circuit.total_calls = 0;
    circuit.consecutive_failures = 0;
    circuit.consecutive_successes = 0;
    circuit.last_failure_time = 0;
    circuit.last_state_change = clock.unix_timestamp;
    circuit.lifetime_failures = 0;
    circuit.lifetime_successes = 0;
    circuit.bump = ctx.bumps.circuit;

    msg!("Circuit created: {}", name);
    Ok(())
}
