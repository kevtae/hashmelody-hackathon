use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::{ViewershipOracle, PriceParameters, TokenVault};

// Second instruction: Initialize oracle and vault
#[derive(Accounts)]
pub struct InitializeTokenOracle<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        space = ViewershipOracle::INIT_SPACE,
        seeds = [b"viewership_oracle", mint.key().as_ref()],
        bump
    )]
    pub oracle: Account<'info, ViewershipOracle>,

    #[account(
        init_if_needed,
        payer = payer,
        space = TokenVault::SPACE,
        seeds = [b"token_vault", mint.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenVault>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeTokenOracle>) -> Result<()> {
    // Initialize oracle
    let oracle = &mut ctx.accounts.oracle;
    oracle.mint = ctx.accounts.mint.key();
    oracle.view_count = 0;
    oracle.last_updated = Clock::get()?.unix_timestamp;
    
    // Set default price parameters
    oracle.price_params = PriceParameters {
        k: 1,
        m: 100,
    };
    oracle.bump = ctx.bumps.oracle;

    // Initialize token vault
    let vault = &mut ctx.accounts.token_vault;
    vault.mint = ctx.accounts.mint.key();
    vault.liquidity_threshold = 10_000_000_000; // 10 SOL
    vault.raydium_pool = None;
    vault.total_collected = 0;
    vault.bump = ctx.bumps.token_vault;
    
    msg!("Token oracle and vault initialized successfully!");
    Ok(())
}