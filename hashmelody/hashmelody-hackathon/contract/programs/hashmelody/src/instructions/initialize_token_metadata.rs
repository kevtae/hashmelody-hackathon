use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::{MintAuthority, TokenMetadata};
use crate::error::TokenError;

#[derive(Accounts)]
#[instruction(id: u64, name: String, music_uri: String)]
pub struct InitializeTokenMetadata<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 1,
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump,
    )]
    pub mint_authority: Account<'info, MintAuthority>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        space = TokenMetadata::SPACE,
        seeds = [b"metadata", mint.key().as_ref(), &id.to_le_bytes()],
        bump
    )]
    pub metadata: Account<'info, TokenMetadata>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeTokenMetadata>,
    id: u64,
    name: String,
    music_uri: String,
) -> Result<()> {
    // Validate lengths
    require!(name.len() <= 16, TokenError::NameTooLong);
    require!(music_uri.len() <= 44, TokenError::UriTooLong);
    
    // Initialize metadata
    let metadata = &mut ctx.accounts.metadata;
    metadata.mint = ctx.accounts.mint.key();
    metadata.name = name;
    metadata.music_uri = music_uri;   
    metadata.id = id;

    // Store the bump in mint authority
    ctx.accounts.mint_authority.bump = ctx.bumps.mint_authority;
    
    msg!("Token metadata initialized successfully!");
    Ok(())
}