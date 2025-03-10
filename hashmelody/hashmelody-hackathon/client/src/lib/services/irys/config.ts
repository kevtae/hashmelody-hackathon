// File size limits
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Irys funding configuration
export const IRYS_CONFIG = {
  MIN_BALANCE: 0.05,
  FUND_AMOUNT: 0.5,
  GATEWAY_URL: "https://gateway.irys.xyz",
  NODE_URL: "https://node1.irys.xyz",
  TOKEN: "solana",
  RPC_URL: "https://api.devnet.solana.com"
} as const;

// Irys upload configuration
export const UPLOAD_CONFIG = {
  TEMP_DIR: "/tmp",
  DEFAULT_CONTENT_TYPE: "audio/mpeg",
  APPLICATION_NAME: "HashMelody",
} as const;

// Environment validation
export function validateEnvironment(): void {
  if (!process.env.PRIVATE_KEY_SOL) {
    throw new Error("PRIVATE_KEY_SOL is not set in environment variables");
  }
}

// Helper function to build Irys gateway URL
export function buildGatewayUrl(transactionId: string): string {
  return `${IRYS_CONFIG.GATEWAY_URL}/${transactionId}`;
}