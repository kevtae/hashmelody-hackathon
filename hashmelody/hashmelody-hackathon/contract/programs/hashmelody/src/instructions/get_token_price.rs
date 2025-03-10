use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token}; // Add Token here
use crate::state::ViewershipOracle;


#[derive(Accounts)]
pub struct GetTokenPrice<'info> {
    // No ownership or signer constraints on mint
    pub mint: Account<'info, Mint>,
    
    // Simpler PDA validation without using oracle.bump
    #[account(
        seeds = [b"viewership_oracle", mint.key().as_ref()],
        bump,  // Anchor will find the correct bump automatically
    )]
    pub oracle: Account<'info, ViewershipOracle>,
    
    // Include token program to ensure proper mint account validation
    pub token_program: Program<'info, Token>,
}
pub fn handler(ctx: Context<GetTokenPrice>) -> Result<u64> {
    let oracle = &ctx.accounts.oracle;
    let current_supply = ctx.accounts.mint.supply;
    
    // Use the existing price calculation logic
    let price = oracle.calculate_price(current_supply)?;
    
    Ok(price)
}
