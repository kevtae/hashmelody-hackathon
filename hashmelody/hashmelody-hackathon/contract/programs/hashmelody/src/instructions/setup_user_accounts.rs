use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::state::PlatformConfig;

// Setup user and platform token accounts separately
#[derive(Accounts)]
pub struct SetupUserAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        address = platform_config.platform_wallet
    )]
    pub platform_wallet: SystemAccount<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = platform_wallet
    )]
    pub platform_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the recipient's account
    pub recipient: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<SetupUserAccounts>) -> Result<()> {
    msg!("User token accounts set up successfully!");
    Ok(())
}