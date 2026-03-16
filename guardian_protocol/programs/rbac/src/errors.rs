use anchor_lang::prelude::*;

#[error_code]
pub enum RbacError {
    #[msg("The role has expired")]
    RoleExpired,
    #[msg("The role assignment has expired")]
    AssignmentExpired,
    #[msg("The signer does not have the required permission")]
    PermissionDenied,
    #[msg("Delegation depth limit exceeded")]
    DelegationDepthExceeded,
    #[msg("Only the authority admin can perform this action")]
    Unauthorized,
    #[msg("The role name is too long (max 32 chars)")]
    NameTooLong,
    #[msg("The time policy window is not currently active")]
    OutsidePolicyWindow,
}
