use anchor_lang::prelude::*;

#[error_code]
pub enum TokenError {
    #[msg("Name must be between 1 and 32 characters")]
    NameTooLong,
    #[msg("URI must be between 1 and 44 characters")]  // Updated message
    UriTooLong,
    #[msg("Decimals must be less than or equal to 9")]
    InvalidDecimals,
    #[msg("Name can only contain alphanumeric characters and spaces")]
    InvalidNameCharacters,
    #[msg("URI must start with http://, https://, or ipfs://")]
    InvalidUriFormat,
    #[msg("Invalid amount provided")]
    InvalidAmount,
    #[msg("Insufficient funds for purchase")]
    InsufficientFunds,
    #[msg("Supply calculation overflow")]
    SupplyOverflow,
    #[msg("Invalid view count provided")]
    InvalidViewCount,
    #[msg("Only platform authority can update oracle")]
    UnauthorizedOracleUpdate,
    #[msg("Invalid platform wallet provided")]
    InvalidPlatformWallet,
}