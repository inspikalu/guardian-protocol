pub mod state;
pub mod instructions;
pub mod errors;

use anchor_lang::prelude::*;
use crate::instructions::*;

declare_id!("9GXUR2xcVDxnu1JNEdDqCrLRL9K44t5iYxcTWekMaPma");

#[program]
pub mod circuit_breaker {
    use super::*;

    /// Create a new circuit breaker for a named resource.
    pub fn create_circuit(
        ctx: Context<CreateCircuit>,
        name: String,
        label: String,
        failure_threshold: u32,
        success_threshold: u32,
        timeout_seconds: i64,
    ) -> Result<()> {
        instructions::create_circuit::handler(ctx, name, label, failure_threshold, success_threshold, timeout_seconds)
    }

    /// Update the label of an existing circuit.
    pub fn update_circuit_label(ctx: Context<UpdateCircuitLabel>, new_label: String) -> Result<()> {
        instructions::update_circuit_label::handler(ctx, new_label)
    }

    /// Record a successful call — resets failure counter, closes HalfOpen circuits.
    pub fn record_success(ctx: Context<RecordSuccess>) -> Result<()> {
        instructions::record_success::handler(ctx)
    }

    /// Record a failed call — increments failure counter, opens circuit on threshold.
    pub fn record_failure(ctx: Context<RecordFailure>) -> Result<()> {
        instructions::record_failure::handler(ctx)
    }

    /// Check if the circuit allows calls — errors if Open, auto-transitions to HalfOpen after timeout.
    pub fn check_state(ctx: Context<CheckState>) -> Result<()> {
        instructions::check_state::handler(ctx)
    }

    /// Emergency override: force-open the circuit (authority only).
    pub fn force_open(ctx: Context<ForceOpen>) -> Result<()> {
        instructions::force_open::handler(ctx)
    }

    /// Reset all counters and return circuit to Closed (authority only).
    pub fn reset_circuit(ctx: Context<ResetCircuit>) -> Result<()> {
        instructions::reset_circuit::handler(ctx)
    }

    /// Close a circuit (useful for cleanup or layout migration).
    pub fn close_circuit(ctx: Context<CloseCircuit>, name: String) -> Result<()> {
        instructions::close_circuit::handler(ctx, name)
    }
}
