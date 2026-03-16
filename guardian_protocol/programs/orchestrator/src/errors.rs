use anchor_lang::prelude::*;

#[error_code]
pub enum OrchestratorError {
    #[msg("RBAC permission check failed")]
    PermissionDenied,
    #[msg("Circuit breaker is OPEN — operation blocked")]
    CircuitOpen,
    #[msg("Lock is unavailable — already held by another")]
    LockUnavailable,
}
