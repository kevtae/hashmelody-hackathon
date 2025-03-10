use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::state::TokenVault;

// Setup just the vault token account
#[derive(Accounts)]
pub struct SetupVaultAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        seeds = [b"token_vault", mint.key().as_ref()],
        bump,
        mut
    )]
    pub token_vault: Account<'info, TokenVault>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = token_vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<SetupVaultAccount>) -> Result<()> {
    // Store vault token account in vault
    let vault = &mut ctx.accounts.token_vault;
    
    vault.vault_account = ctx.accounts.vault_token_account.key();

    vault.sol_vault_wallet = ctx.accounts.payer.key(); 

    
    msg!("Vault token account set up successfully!");
    Ok(())
}