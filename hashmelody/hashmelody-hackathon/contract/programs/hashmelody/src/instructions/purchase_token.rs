use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, mint_to, MintTo},
    associated_token::AssociatedToken,
};
use crate::state::{MintAuthority, ViewershipOracle, PlatformConfig, TokenVault};
use crate::error::TokenError;

#[derive(Accounts)]
pub struct PurchaseToken<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        address = token_vault.sol_vault_wallet 
    )]
    pub sol_vault_wallet: SystemAccount<'info>,
    

    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        address = platform_config.platform_wallet
    )]
    pub platform_wallet: SystemAccount<'info>,

    #[account(
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump = mint_authority.bump
    )]
    pub mint_authority: Account<'info, MintAuthority>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"token_vault", mint.key().as_ref()],
        bump = token_vault.bump
    )]
    pub token_vault: Account<'info, TokenVault>,

    #[account(
        mut,
        constraint = vault_token_account.key() == token_vault.vault_account
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"viewership_oracle", mint.key().as_ref()],
        bump = oracle.bump
    )]
    pub oracle: Account<'info, ViewershipOracle>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<PurchaseToken>,
    amount_tokens: u64,
) -> Result<()> {
    // Validate amount is not zero
    require!(amount_tokens > 0, TokenError::InvalidAmount);
    
    // Get current supply and calculate price
    let current_supply = ctx.accounts.mint.supply;
    
    // Check if new supply would overflow
    let new_supply = current_supply
        .checked_add(amount_tokens)
        .ok_or(TokenError::SupplyOverflow)?;
        
    let price_per_token = ctx.accounts.oracle.calculate_price(current_supply)?;
    
    // Calculate total cost and validate
    let total_cost = price_per_token
        .checked_mul(amount_tokens)
        .ok_or(TokenError::SupplyOverflow)?;
    
    // Calculate platform fee (2.5%) with overflow checks
    let platform_fee = total_cost
        .checked_mul(25)
        .ok_or(TokenError::SupplyOverflow)?
        .checked_div(1000)
        .ok_or(TokenError::SupplyOverflow)?;
    
    let vault_amount = total_cost
        .checked_sub(platform_fee)
        .ok_or(TokenError::SupplyOverflow)?;
    
    // Check if the buyer has enough SOL
    require!(
        ctx.accounts.buyer.lamports() >= total_cost,
        TokenError::InsufficientFunds
    );

    msg!("Price per token: {} lamports", price_per_token);
    msg!("Total cost: {} lamports", total_cost);
    msg!("Platform fee: {} lamports", platform_fee);
    msg!("Amount to vault: {} lamports", vault_amount);

    // Transfer platform fee to platform wallet
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.platform_wallet.to_account_info(),
            },
        ),
        platform_fee,
    )?;

    // Transfer remaining amount to token vault
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.sol_vault_wallet.to_account_info(),
            },
        ),
        vault_amount,
    )?;

    // Update vault total collected
    let vault = &mut ctx.accounts.token_vault;
    vault.total_collected = vault.total_collected
        .checked_add(vault_amount)
        .ok_or(TokenError::SupplyOverflow)?;

    // Check if we've hit the liquidity threshold
    if vault.total_collected >= vault.liquidity_threshold {
        if let Some(raydium_pool) = vault.raydium_pool {
            msg!("Liquidity threshold reached! Consider calling provide_liquidity instruction");
        }
    }

    // Mint tokens to buyer
    let mint_key = ctx.accounts.mint.key();
    let mint_auth_seeds = &[
        b"mint_authority".as_ref(),
        mint_key.as_ref(),
        &[ctx.accounts.mint_authority.bump],
    ];
    let signer_seeds = &[&mint_auth_seeds[..]];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.buyer_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount_tokens,
    )?;

    msg!("Successfully purchased {} tokens", amount_tokens);
    Ok(())
}