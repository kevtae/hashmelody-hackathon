use anchor_lang::prelude::*;
use crate::state::PlatformConfig;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = PlatformConfig::SPACE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializePlatform>,
    platform_wallet: Pubkey,
    oracle_authority: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    config.platform_wallet = platform_wallet;
    config.oracle_authority = oracle_authority;
    config.authority = ctx.accounts.authority.key();
    config.bump = ctx.bumps.platform_config;
    Ok(())
}
