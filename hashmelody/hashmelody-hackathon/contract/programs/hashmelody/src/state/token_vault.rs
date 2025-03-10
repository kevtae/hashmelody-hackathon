use anchor_lang::prelude::*;

#[account]
pub struct TokenVault {
    pub mint: Pubkey,                    // Associated token mint
    pub vault_account: Pubkey,           // Token account holding collected SOL
    pub sol_vault_wallet: Pubkey,        // For SOL (add this)
    pub raydium_pool: Option<Pubkey>,    // Associated Raydium pool if exists
    pub liquidity_threshold: u64,        // Threshold for auto-providing liquidity
    pub total_collected: u64,            // Total SOL collected
    pub bump: u8,
}

impl TokenVault {
    pub const SPACE: usize = 8 +     // discriminator
        32 +                         // mint
        32 +                         // vault_account
        32 +                         // sol_vault_wallet (add this)
        (1 + 32) +                  // Option<Pubkey> for raydium_pool
        8 +                         // liquidity_threshold
        8 +                         // total_collected
        1;                          // bump
}
