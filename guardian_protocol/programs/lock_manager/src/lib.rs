pub mod state;
pub mod instructions;
pub mod errors;

use anchor_lang::prelude::*;
use crate::instructions::*;

declare_id!("reMMumQqHvHcQWJnyURAASgsp3zomq6cLdW3dUyyZ7j");

#[program]
pub mod lock_manager {
    use super::*;

    /// Create a new distributed lock for a resource.
    pub fn create_lock(
        ctx: Context<CreateLock>,
        resource_id: String,
        max_lease_duration: i64,
        allow_reentrancy: bool,
    ) -> Result<()> {
        instructions::create_lock::handler(ctx, resource_id, max_lease_duration, allow_reentrancy)
    }

    /// Acquire a lock. Errors if already held. Supports reentrancy.
    pub fn acquire_lock(ctx: Context<AcquireLock>, lease_duration: i64) -> Result<()> {
        instructions::acquire_lock::handler(ctx, lease_duration)
    }

    /// Release a lock held by the caller.
    pub fn release_lock(ctx: Context<ReleaseLock>) -> Result<()> {
        instructions::release_lock::handler(ctx)
    }

    /// Extend the caller's current lease duration.
    pub fn extend_lock(ctx: Context<ExtendLock>, additional_seconds: i64) -> Result<()> {
        instructions::extend_lock::handler(ctx, additional_seconds)
    }

    /// Force-release any lock (authority only).
    pub fn force_unlock(ctx: Context<ForceUnlock>) -> Result<()> {
        instructions::force_unlock::handler(ctx)
    }

    /// Permissionless — clean up a lock whose lease has already expired.
    pub fn expire_lock(ctx: Context<ExpireLock>) -> Result<()> {
        instructions::expire_lock::handler(ctx)
    }

    /// Close a lock (useful for cleanup or layout migration).
    pub fn close_lock(ctx: Context<CloseLock>, resource_id: String) -> Result<()> {
        instructions::close_lock::handler(ctx, resource_id)
    }
}
