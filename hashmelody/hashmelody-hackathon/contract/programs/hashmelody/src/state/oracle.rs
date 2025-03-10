use anchor_lang::prelude::*;
use crate::error::TokenError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct PriceParameters {
    pub k: u64,                  // Quadratic growth factor (scaled by 1e6)
    pub m: u64,                  // View count scaling factor (scaled by 1e6)
}

#[account]
pub struct ViewershipOracle {
    pub mint: Pubkey,            
    pub view_count: u64,         
    pub last_updated: i64,       
    pub price_params: PriceParameters,
    pub bump: u8,
}

impl ViewershipOracle {
    pub const INIT_SPACE: usize = 8 +    // discriminator
        32 +                              // mint
        8 +                              // view_count
        8 +                              // last_updated
        16 +                             // price_params (k + m)
        1;  
        
        pub fn calculate_price(&self, supply: u64) -> Result<u64> {
            let k = self.price_params.k as f64 / 1_000_000_000_000.0;  // Scale k down by 1e12
            let m = self.price_params.m as f64 / 1_000_000.0;
            
            // Convert and scale down supply for calculations
            let supply_in_millions = (supply as f64) / 1_000_000_000_000.0;  // Scale down by 1e12
            
            // Calculate quadratic term with overflow check
            let quadratic = k * supply_in_millions * supply_in_millions;
            if quadratic.is_infinite() || quadratic.is_nan() {
                msg!("Quadratic term overflow: k={}, supply={}", k, supply);
                return Err(error!(TokenError::SupplyOverflow));
            }
            
            // Calculate view term with overflow check
            let view_sqrt = (self.view_count as f64).sqrt();
            let views = m * view_sqrt;
            if views.is_infinite() || views.is_nan() {
                msg!("Views term overflow: m={}, view_count={}", m, self.view_count);
                return Err(error!(TokenError::SupplyOverflow));
            }
            
            // Calculate final price in lamports (scale back up but keep it reasonable)
            let calculated_price = (quadratic + views) * 100_000.0; // Scale to lamports
            
            // Apply minimum price of 0.001 SOL (1,000,000 lamports)
            let final_price = calculated_price.max(1_000_000.0);
            
            if final_price.is_infinite() || final_price.is_nan() || final_price >= u64::MAX as f64 {
                msg!("Final price overflow: quadratic={}, views={}", quadratic, views);
                return Err(error!(TokenError::SupplyOverflow));
            }
            
            // Add debug logging
            msg!("Price calculation:");
            msg!("Supply: {}", supply);
            msg!("View count: {}", self.view_count);
            msg!("k: {}", k);
            msg!("m: {}", m);
            msg!("Quadratic term: {}", quadratic);
            msg!("Views term: {}", views);
            msg!("Calculated price (lamports): {}", calculated_price);
            msg!("Final price with minimum (lamports): {}", final_price);
            
            Ok(final_price as u64)
        }
    
}