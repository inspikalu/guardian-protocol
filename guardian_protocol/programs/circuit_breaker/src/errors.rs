use anchor_lang::prelude::*;

#[error_code]
pub enum CircuitError {
    #[msg("Circuit is OPEN — service temporarily unavailable")]
    CircuitOpen,
    #[msg("Only the circuit authority can perform this action")]
    Unauthorized,
    #[msg("Circuit name is too long (max 32 chars)")]
    NameTooLong,
    #[msg("The circuit is already in the requested state")]
    AlreadyInState,
}
