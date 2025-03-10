use anchor_lang::prelude::*;
use crate::state::PlatformConfig;

#[derive(Accounts)]
pub struct UpdatePlatform<'info> {
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump,
        has_one = authority
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub authority: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdatePlatform>,
    new_platform_wallet: Pubkey,
    new_oracle_authority: Option<Pubkey>,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    config.platform_wallet = new_platform_wallet;
    
    // Update oracle authority if provided
    if let Some(new_authority) = new_oracle_authority {
        config.oracle_authority = new_authority;
    }
    
    Ok(())
}

