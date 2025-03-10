use anchor_lang::prelude::*;

#[account]
pub struct MintAuthority {
    pub bump: u8,
}
