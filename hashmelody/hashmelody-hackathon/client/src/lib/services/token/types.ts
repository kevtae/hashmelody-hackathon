// lib/services/token/types.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';

export interface CreateTokenParams {
  id: number;
  name: string;
  metadataUri: string;
  connection: Connection;
  wallet: AnchorWallet;
}

export interface TokenResult {
  signature: string;
  mint: string;
}

export interface TokenMetadata {
  mint: PublicKey;
  id: number;
  name: string;
  music_uri: string;
}

export interface PriceParameters {
  k: number;
  m: number;
}

export interface ViewershipOracle {
  mint: PublicKey;
  view_count: number;
  last_updated: number;
  price_params: PriceParameters;
  bump: number;
}

export interface TokenVault {
  mint: PublicKey;
  vault_account: PublicKey;
  raydium_pool?: PublicKey;
  liquidity_threshold: number;
  total_collected: number;
  bump: number;
}

export interface TokenError extends Error {
  code?: number;
  message: string;
}