use anchor_lang::prelude::*;

#[account]
pub struct TokenMetadata {
    pub mint: Pubkey,
    pub id: u64,
    pub name: String,  // We'll validate the length in the instruction handler
    pub music_uri: String,  // We'll validate the length in the instruction handler
}

impl TokenMetadata {
    pub const SPACE: usize = 8 +    // discriminator
        32 +                        // mint
        8 +                         // id
        (4 + 16) +                 // name (len + max chars)
        (4 + 44);                  // music_uri (len + max chars)
}