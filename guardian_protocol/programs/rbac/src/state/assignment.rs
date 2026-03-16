use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RoleAssignment {
    pub user: Pubkey,
    pub role: Pubkey,
    pub granted_by: Pubkey,
    pub granted_at: i64,
    pub expires_at: Option<i64>,
    pub can_delegate: bool,
    pub delegation_depth: u8,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AuditLog {
    pub action: u8, // Enum mapped to u8 for simplicity in demo
    pub actor: Pubkey,
    pub target: Option<Pubkey>,
    pub timestamp: i64,
    pub success: bool,
}
