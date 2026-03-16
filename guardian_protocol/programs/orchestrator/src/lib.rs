pub mod instructions;
pub mod errors;

use anchor_lang::prelude::*;
use crate::instructions::*;
use rbac::state::Permission;

declare_id!("X61sTdLaXMaAjdDE9UFSs36FoabSQMiXGS2uABzeJjB");

#[program]
pub mod orchestrator {
    use super::*;

    /// Execute a protected operation through all 3 guardian systems:
    /// RBAC → Circuit Breaker → Lock Manager → Execute → Release → Audit
    pub fn protected_operation(
        ctx: Context<ProtectedOperation>,
        required_permission: Permission,
        lease_duration: i64,
        audit_counter: u64,
    ) -> Result<()> {
        instructions::protected_operation::handler(
            ctx,
            required_permission,
            lease_duration,
            audit_counter,
        )
    }
}
