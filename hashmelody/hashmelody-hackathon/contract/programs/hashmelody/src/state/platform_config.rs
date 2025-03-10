use anchor_lang::prelude::*;

#[account]
pub struct PlatformConfig {
    pub platform_wallet: Pubkey,
    pub oracle_authority: Pubkey,    
    pub authority: Pubkey,
    pub bump: u8,
}

impl PlatformConfig {
    pub const SPACE: usize = 8 +  // discriminator
        32 +                      // platform_wallet
        32 +                      // oracle_authority
        32 +                      // authority
        1;                        // bump
}