use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::{ViewershipOracle, PlatformConfig};
use crate::error::TokenError;

#[derive(Accounts)]
pub struct UpdateOracle<'info> {
    #[account(
        mut,
        seeds = [b"viewership_oracle", mint.key().as_ref()],
        bump = oracle.bump,
    )]
    pub oracle: Account<'info, ViewershipOracle>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        seeds = [b"platform_config"],
        bump,
        constraint = platform_config.oracle_authority == authority.key()
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateOracle>,
    new_view_count: u64,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    
    // Validate the new view count
    require!(
        new_view_count >= oracle.view_count,
        TokenError::InvalidViewCount
    );

    // Get current timestamp
    let current_time = Clock::get()?.unix_timestamp;
    
    // Update the oracle data
    oracle.view_count = new_view_count;
    oracle.last_updated = current_time;
    
    // Calculate the new price based on views and current supply
    let current_supply = ctx.accounts.mint.supply;
    let new_price = oracle.calculate_price(current_supply)?;
    
    // Emit events for monitoring
    msg!("Updated view count for token: {}", ctx.accounts.mint.key());
    msg!("Previous view count: {}", oracle.view_count);
    msg!("New view count: {}", new_view_count);
    msg!("New calculated price (scaled by 1e9): {}", new_price);
    msg!("Last updated: {}", current_time);
    
    Ok(())
}
