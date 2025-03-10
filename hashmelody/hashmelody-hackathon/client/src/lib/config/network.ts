// lib/config/network.ts
import { type Cluster, type Commitment } from "@solana/web3.js";

export type NetworkType = Cluster | "localnet" | "mainnet";

export interface NetworkConfig {
  programId: string;
  platformWallet: string;
  rpcUrl: string;
  commitment: Commitment;
  wsEndpoint?: string;  // WebSocket endpoint for real-time updates
  confirmations?: number;
}

// Network-specific configurations
const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  localnet: {
    programId: "35N9ZFsopSLVcjNRQDNSo77fFAqxmb35W6HUsMtqxgup", // Local program ID
    platformWallet: "7iLzG3Luw1byi9sSs4BQqYw45BmsEnDYMCTzUB4MU6ed", // Local platform wallet
    rpcUrl: "http://localhost:8899",
    wsEndpoint: "ws://localhost:8900",
    commitment: "confirmed",
    confirmations: 1
  },
  devnet: {
    programId: "Hyx4f8rP2wfXWiSp9CPakPbZ13oZLiLJbra7GiHscWkR",
    platformWallet: "7iLzG3Luw1byi9sSs4BQqYw45BmsEnDYMCTzUB4MU6ed",
    rpcUrl: "https://api.devnet.solana.com",
    wsEndpoint: "wss://api.devnet.solana.com",
    commitment: "confirmed",
    confirmations: 2
  },
  mainnet: {
    programId: "Awipy96Lc7wKnQ7xpFkiv4qFV1ppUnZM8unTPeWKsLT7", // Mainnet program ID
    platformWallet: "FkanWUdQYYfp2s3tiS3EnfCmTN2aMhXs63pfTvg58Zer", // Mainnet platform wallet
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    commitment: "confirmed",
    confirmations: 2
  },
  "mainnet-beta": {
    programId: "Awipy96Lc7wKnQ7xpFkiv4qFV1ppUnZM8unTPeWKsLT7", // Mainnet program ID
    platformWallet: "FkanWUdQYYfp2s3tiS3EnfCmTN2aMhXs63pfTvg58Zer", // Mainnet platform wallet
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wsEndpoint: "wss://api.mainnet-beta.solana.com",
    commitment: "confirmed",
    confirmations: 2
  },
  testnet: {
    programId: "Awipy96Lc7wKnQ7xpFkiv4qFV1ppUnZM8unTPeWKsLT7", // Testnet program ID
    platformWallet: "FkanWUdQYYfp2s3tiS3EnfCmTN2aMhXs63pfTvg58Zer", // Testnet platform wallet
    rpcUrl: "https://api.testnet.solana.com",
    wsEndpoint: "wss://api.testnet.solana.com",
    commitment: "confirmed",
    confirmations: 2
  },
};

// Environment-based network selection
export function getNetwork(): NetworkType {
  const network = process.env.SOLANA_NETWORK as NetworkType;
  if (!network || !NETWORK_CONFIGS[network]) {
    console.log("SOLANA_NETWORK not set or invalid, defaulting to localnet");
    return "devnet";
  }
  console.log(`Using network: ${network}`);
  return network;
}

// Get network configuration
export function getConnectionConfig(): { endpoint: string; commitment: Commitment } {
  const network = getNetwork();
  const config = NETWORK_CONFIGS[network];
  console.log(`Connection config for ${network}:`, config);
  return {
    endpoint: config.rpcUrl,
    commitment: config.commitment
  };
}

export function getNetworkConfig(): NetworkConfig {
  const network = getNetwork();
  const config = NETWORK_CONFIGS[network];
  if (!config) {
    throw new Error(`Network configuration not found for ${network}`);
  }
  console.log(`Network config for ${network}:`, config);
  return config;
}