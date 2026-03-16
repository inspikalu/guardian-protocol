use anchor_lang::prelude::*;
use rbac::cpi::accounts::{CheckPermission, EmitAudit};
use rbac::program::Rbac;
use rbac::state::Permission;
use circuit_breaker::cpi::accounts::{CheckState, RecordSuccess};
use circuit_breaker::program::CircuitBreaker;
use lock_manager::cpi::accounts::{AcquireLock, ReleaseLock};
use lock_manager::program::LockManager;

/// Runs the full protected operation chain:
///   1. RBAC: check_permission
///   2. Circuit Breaker: check_state
///   3. Lock Manager: acquire_lock
///   4. (Business logic happens offchain / in this handler)
///   5. Circuit Breaker: record_success
///   6. Lock Manager: release_lock
///   7. RBAC: emit_audit
#[derive(Accounts)]
pub struct ProtectedOperation<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    // ── RBAC accounts ──
    /// CHECK: Validated inside the RBAC program CPI
    pub rbac_role: UncheckedAccount<'info>,
    /// CHECK: Validated inside the RBAC program CPI
    pub rbac_assignment: UncheckedAccount<'info>,
    /// CHECK: AuditLog PDA — initialized inside the RBAC program CPI
    #[account(mut)]
    pub audit_log: UncheckedAccount<'info>,
    pub rbac_program: Program<'info, Rbac>,

    // ── Circuit Breaker accounts ──
    #[account(mut)]
    /// CHECK: Circuit PDA — validated inside the Circuit Breaker CPI
    pub circuit: UncheckedAccount<'info>,
    pub circuit_breaker_program: Program<'info, CircuitBreaker>,

    // ── Lock Manager accounts ──
    #[account(mut)]
    /// CHECK: Lock PDA — validated inside the Lock Manager CPI
    pub lock: UncheckedAccount<'info>,
    #[account(mut)]
    /// CHECK: LockReceipt PDA — initialized inside the Lock Manager CPI
    pub lock_receipt: UncheckedAccount<'info>,
    pub lock_manager_program: Program<'info, LockManager>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<ProtectedOperation>,
    required_permission: Permission,
    lease_duration: i64,
    audit_counter: u64,
) -> Result<()> {
    // ─── Step 1: RBAC — Check Permission ───
    let rbac_check_ctx = CpiContext::new(
        ctx.accounts.rbac_program.to_account_info(),
        CheckPermission {
            user: ctx.accounts.user.to_account_info(),
            role: ctx.accounts.rbac_role.to_account_info(),
            assignment: ctx.accounts.rbac_assignment.to_account_info(),
        },
    );
    rbac::cpi::check_permission(rbac_check_ctx, required_permission)?;
    msg!("Step 1: RBAC - Permission check passed");

    // ─── Step 2: Circuit Breaker — Check State ───
    let cb_check_ctx = CpiContext::new(
        ctx.accounts.circuit_breaker_program.to_account_info(),
        CheckState {
            circuit: ctx.accounts.circuit.to_account_info(),
        },
    );
    circuit_breaker::cpi::check_state(cb_check_ctx)?;
    msg!("Step 2: Circuit Breaker - Circuit is healthy");

    // ─── Step 3: Lock Manager — Acquire Lock ───
    let lock_acquire_ctx = CpiContext::new(
        ctx.accounts.lock_manager_program.to_account_info(),
        AcquireLock {
            acquirer: ctx.accounts.user.to_account_info(),
            lock: ctx.accounts.lock.to_account_info(),
            receipt: ctx.accounts.lock_receipt.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
    );
    lock_manager::cpi::acquire_lock(lock_acquire_ctx, lease_duration)?;
    msg!("Step 3: Lock Manager - Lock acquired");

    // ─── Step 4: Business logic executes here ───
    msg!("Step 4: Business Logic - Protected operation executed");

    // ─── Step 5: Circuit Breaker — Record Success ───
    let cb_success_ctx = CpiContext::new(
        ctx.accounts.circuit_breaker_program.to_account_info(),
        RecordSuccess {
            circuit: ctx.accounts.circuit.to_account_info(),
        },
    );
    circuit_breaker::cpi::record_success(cb_success_ctx)?;
    msg!("Step 5: Circuit Breaker - Success recorded");

    // ─── Step 6: Lock Manager — Release Lock ───
    let lock_release_ctx = CpiContext::new(
        ctx.accounts.lock_manager_program.to_account_info(),
        ReleaseLock {
            owner: ctx.accounts.user.to_account_info(),
            lock: ctx.accounts.lock.to_account_info(),
            receipt: ctx.accounts.lock_receipt.to_account_info(),
        },
    );
    lock_manager::cpi::release_lock(lock_release_ctx)?;
    msg!("Step 6: Lock Manager - Lock released");

    // ─── Step 7: RBAC — Emit Audit Log ───
    let audit_ctx = CpiContext::new(
        ctx.accounts.rbac_program.to_account_info(),
        EmitAudit {
            actor: ctx.accounts.user.to_account_info(),
            audit_log: ctx.accounts.audit_log.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        },
    );
    rbac::cpi::emit_audit(audit_ctx, audit_counter, 1u8, None, true)?;
    msg!("Step 7: RBAC - Audit log recorded");

    msg!("Protected operation completed successfully");
    Ok(())
}
