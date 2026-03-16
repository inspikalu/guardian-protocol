use anchor_lang::prelude::*;

/// Optional time-window policy attached to a role.
/// Enforced by check_permission: the unix clock must fall within [start, end].
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct TimePolicy {
    pub start: i64,
    pub end: i64,
}
