use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod error;

use instructions::*;

declare_id!("8JUg9X2kSHvVgc2stoiAVwDoRtKZGEp2p42Z7Ficby6a");

#[program]
pub mod hashmelody {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        platform_wallet: Pubkey,
        oracle_authority: Pubkey,
    ) -> Result<()> {
        instructions::initialize_platform::handler(ctx, platform_wallet, oracle_authority)
    }

    pub fn update_platform(
        ctx: Context<UpdatePlatform>,
        new_platform_wallet: Pubkey,
        new_oracle_authority: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_platform::handler(ctx, new_platform_wallet, new_oracle_authority)
    }

    // Step 1: Initialize token metadata and authority
    pub fn initialize_token_metadata(
        ctx: Context<InitializeTokenMetadata>, 
        id: u64,
        name: String,
        music_uri: String,
    ) -> Result<()> {
        instructions::initialize_token_metadata::handler(ctx, id, name, music_uri)
    }

    // Step 2: Initialize oracle and vault
    pub fn initialize_token_oracle(
        ctx: Context<InitializeTokenOracle>,
    ) -> Result<()> {
        instructions::initialize_token_oracle::handler(ctx)
    }

    // Step 3: Set up vault token account
    pub fn setup_vault_account(
        ctx: Context<SetupVaultAccount>,
    ) -> Result<()> {
        instructions::setup_vault_account::handler(ctx)
    }

    // Step 4: Set up user token accounts
    pub fn setup_user_accounts(
        ctx: Context<SetupUserAccounts>,
    ) -> Result<()> {
        instructions::setup_user_accounts::handler(ctx)
    }

    // Step 5: Mint tokens
    pub fn mint_token(
        ctx: Context<MintToken>,
    ) -> Result<()> {
        instructions::mint_token::handler(ctx)
    }

    pub fn update_oracle(
        ctx: Context<UpdateOracle>,
        new_view_count: u64,
    ) -> Result<()> {
        instructions::update_oracle::handler(ctx, new_view_count)
    }

    pub fn purchase_token(
        ctx: Context<PurchaseToken>,
        amount_tokens: u64,
    ) -> Result<()> {
        instructions::purchase_token::handler(ctx, amount_tokens)
    }

    pub fn get_token_price(
        ctx: Context<GetTokenPrice>,
    ) -> Result<u64> {
        instructions::get_token_price::handler(ctx)
    }

    pub fn get_vault_balance(
        ctx: Context<GetVaultBalance>,
    ) -> Result<u64> {
        instructions::get_vault_balance::handler(ctx)
    }
}