use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Authority {
    pub admin: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Role {
    pub name: [u8; 32],
    pub permissions: [crate::state::Permission; 10],
    pub parent_role: Option<Pubkey>,
    pub created_by: Pubkey,
    pub created_at: i64,
    pub expires_at: Option<i64>,
    pub bump: u8,
}
