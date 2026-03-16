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
    #[max_len(32)]
    pub name: String,
    // Note: Dynamic Vec in accounts requires careful space management.
    // We'll start with a fixed capacity for the demo.
    #[max_len(10)]
    pub permissions: Vec<crate::state::Permission>,
    pub parent_role: Option<Pubkey>,
    pub created_by: Pubkey,
    pub created_at: i64,
    pub expires_at: Option<i64>,
    pub bump: u8,
}
