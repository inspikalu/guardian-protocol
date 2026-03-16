use anchor_lang::prelude::*;
use crate::state::AuditLog;
use crate::constants::*;

#[derive(Accounts)]
#[instruction(counter: u64)]
pub struct EmitAudit<'info> {
    #[account(mut)]
    pub actor: Signer<'info>,

    #[account(
        init,
        payer = actor,
        space = 8 + AuditLog::INIT_SPACE,
        seeds = [AUDIT_SEED, counter.to_le_bytes().as_ref()],
        bump,
    )]
    pub audit_log: Account<'info, AuditLog>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<EmitAudit>,
    _counter: u64,
    action: u8,
    target: Option<Pubkey>,
    success: bool,
) -> Result<()> {
    let clock = Clock::get()?;
    let log = &mut ctx.accounts.audit_log;

    log.action = action;
    log.actor = ctx.accounts.actor.key();
    log.target = target;
    log.timestamp = clock.unix_timestamp;
    log.success = success;

    msg!(
        "Audit: action={} actor={} success={}",
        action,
        log.actor,
        success
    );
    Ok(())
}
