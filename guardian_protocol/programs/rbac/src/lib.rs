pub mod state;
pub mod instructions;
pub mod errors;
pub mod constants;

use anchor_lang::prelude::*;
use crate::instructions::*;
use crate::state::Permission;

declare_id!("EdNSQ2mmw6LZ1ySE2okzzBerfL7JzQkP3od2Yav8mKfS");

#[program]
pub mod rbac {
    use super::*;

    /// Initialize the root Authority PDA. Must be called before any other instruction.
    pub fn initialize_authority(ctx: Context<InitializeAuthority>) -> Result<()> {
        instructions::initialize_authority::handler(ctx)
    }

    /// Create a named role with a set of permissions.
    pub fn create_role(
        ctx: Context<CreateRole>,
        name: String,
        permissions: Vec<Permission>,
        parent_role: Option<Pubkey>,
        expiry: Option<i64>,
    ) -> Result<()> {
        instructions::create_role::handler(ctx, name, permissions, parent_role, expiry)
    }

    /// Grant a role to a user (creates a RoleAssignment PDA).
    pub fn grant_role(
        ctx: Context<GrantRole>,
        user: Pubkey,
        expiry: Option<i64>,
        can_delegate: bool,
    ) -> Result<()> {
        instructions::grant_role::handler(ctx, user, expiry, can_delegate)
    }

    /// Check that the signer has a specific permission. Errors if not.
    pub fn check_permission(
        ctx: Context<CheckPermission>,
        required_permission: Permission,
    ) -> Result<()> {
        instructions::check_permission::handler(ctx, required_permission)
    }

    /// Revoke a role assignment (closes the RoleAssignment account).
    pub fn revoke_role(ctx: Context<RevokeRole>) -> Result<()> {
        instructions::revoke_role::handler(ctx)
    }

    /// Emit an on-chain audit log entry.
    pub fn emit_audit(
        ctx: Context<EmitAudit>,
        counter: u64,
        action: u8,
        target: Option<Pubkey>,
        success: bool,
    ) -> Result<()> {
        instructions::emit_audit::handler(ctx, counter, action, target, success)
    }
}
