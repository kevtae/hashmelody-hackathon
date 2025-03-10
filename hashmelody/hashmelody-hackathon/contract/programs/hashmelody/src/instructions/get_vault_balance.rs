use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::state::TokenVault;

#[derive(Accounts)]
pub struct GetVaultBalance<'info> {
    #[account(
        seeds = [b"token_vault", mint.key().as_ref()],
        bump,
    )]
    pub token_vault: Account<'info, TokenVault>,
    
    pub mint: Account<'info, Mint>,
    
    #[account(
        address = token_vault.sol_vault_wallet
    )]
    pub sol_vault_wallet: SystemAccount<'info>,
}

pub fn handler(ctx: Context<GetVaultBalance>) -> Result<u64> {
    let sol_balance = ctx.accounts.sol_vault_wallet.lamports();
    
    msg!("SOL vault balance: {} lamports", sol_balance);
    msg!("SOL vault address: {}", ctx.accounts.sol_vault_wallet.key());
    msg!("Total collected (from vault data): {} lamports", ctx.accounts.token_vault.total_collected);
    
    Ok(sol_balance)
}