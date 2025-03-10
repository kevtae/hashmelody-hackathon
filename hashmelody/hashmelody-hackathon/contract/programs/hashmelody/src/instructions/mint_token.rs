use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, mint_to, MintTo},
};
use crate::state::{MintAuthority};

// Fourth instruction: Actually mint the tokens
#[derive(Accounts)]
pub struct MintToken<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        seeds = [b"mint_authority", mint.key().as_ref()],
        bump = mint_authority.bump,
    )]
    pub mint_authority: Account<'info, MintAuthority>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = token_account.mint == mint.key()
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = platform_token_account.mint == mint.key()
    )]
    pub platform_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<MintToken>) -> Result<()> {
    // Fixed allocation amount
    let allocation = 50_000_000; // 5% of 1 million tokens with 6 decimals

    // Create signer seeds for mint authority PDA
    let mint_key = ctx.accounts.mint.key();
    let auth_seeds = &[
        b"mint_authority",
        mint_key.as_ref(),
        &[ctx.accounts.mint_authority.bump],
    ];
    let signer_seeds = &[&auth_seeds[..]];

    // Mint tokens to creator
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        allocation,
    )?;

    // Mint tokens to platform
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.platform_token_account.to_account_info(),
                authority: ctx.accounts.mint_authority.to_account_info(),
            },
            signer_seeds,
        ),
        allocation,
    )?;

    msg!("Tokens minted successfully!");
    Ok(())
}