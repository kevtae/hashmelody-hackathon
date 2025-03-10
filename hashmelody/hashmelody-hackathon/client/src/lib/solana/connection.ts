// lib/solana/connection.ts
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Hashmelody } from "@/lib/idl/hashmelody";
import hashmelodyIdl from "@/lib/idl/hashmelody.json";
import { getNetworkConfig } from "@/lib/config/network";
import fs from "fs";
import path from "path";

// Get the network configuration
const getConfig = () => {
  try {
    return getNetworkConfig();
  } catch (error) {
    console.error("Error getting network config:", error);
    // Provide fallback values if network config fails
    return {
      programId: "2HMH4fCCyEPMpsXhoLbyjXmCkD7sKfFTShSzyPw4jLXh",
      platformWallet: "7iLzG3Luw1byi9sSs4BQqYw45BmsEnDYMCTzUB4MU6ed",
      rpcUrl: "https://api.devnet.solana.com",
      commitment: "confirmed" as const,
    };
  }
};

// Get auth keypair from direct file import
export const getAuthKeypair = (): Keypair => {
  try {
    // Direct file import - this works in Node.js environment (server-side only)
    const walletPath = path.resolve(process.cwd(), "service-wallet.json");

    console.log("Looking for wallet file at:", walletPath);

    // Check if file exists
    if (fs.existsSync(walletPath)) {
      console.log("Found service-wallet.json file");
      // Read and parse the file
      const walletData = JSON.parse(fs.readFileSync(walletPath, "utf8"));

      // First try to use the oracle authority for oracle operations
      if (walletData.oracleAuthority && walletData.oracleAuthority.secretKey) {
        console.log("Using oracle authority key from service-wallet.json");
        console.log(
          "Oracle authority public key:",
          walletData.oracleAuthority.publicKey
        );
        const secretKey = new Uint8Array(walletData.oracleAuthority.secretKey);
        return Keypair.fromSecretKey(secretKey);
      }

      // Fallback to platform wallet
      if (walletData.platformWallet && walletData.platformWallet.secretKey) {
        console.log("Using platform wallet key from service-wallet.json");
        console.log(
          "Platform wallet public key:",
          walletData.platformWallet.publicKey
        );
        const secretKey = new Uint8Array(walletData.platformWallet.secretKey);
        return Keypair.fromSecretKey(secretKey);
      }
    }
  } catch (fileError) {
    console.error("Error loading from service-wallet.json:", fileError);
  }

  // If direct file import fails, try environment variables
  try {
    // Try to load from environment variable
    const platformKeysString = process.env.PLATFORM_KEYS;

    if (platformKeysString) {
      console.log("Found PLATFORM_KEYS environment variable");
      // Parse the platform keys JSON
      const platformKeys = JSON.parse(platformKeysString);

      // Use oracle authority key if it exists (needed for oracle updates)
      if (
        platformKeys.oracleAuthority &&
        platformKeys.oracleAuthority.secretKey
      ) {
        console.log("Using oracle authority key from environment variable");
        console.log(
          "Oracle authority public key:",
          platformKeys.oracleAuthority.publicKey
        );
        const secretKey = new Uint8Array(
          platformKeys.oracleAuthority.secretKey
        );
        return Keypair.fromSecretKey(secretKey);
      }

      // Fallback to platform wallet key
      if (
        platformKeys.platformWallet &&
        platformKeys.platformWallet.secretKey
      ) {
        console.log("Using platform wallet key from environment variable");
        console.log(
          "Platform wallet public key:",
          platformKeys.platformWallet.publicKey
        );
        const secretKey = new Uint8Array(platformKeys.platformWallet.secretKey);
        return Keypair.fromSecretKey(secretKey);
      }
    }


    // Fallback to legacy format if the new format isn't available
    const privateKeyString = process.env.SOLANA_PLATFORM_AUTH_KEY;
    if (privateKeyString) {
      console.log("Using SOLANA_PLATFORM_AUTH_KEY environment variable");
      try {
        if (privateKeyString.startsWith("[")) {
          const privateKeyArray = JSON.parse(privateKeyString);
          return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
        }
      } catch (error) {
        console.error("Error parsing legacy private key:", error);
      }
    }
  } catch (envError) {
    console.error("Error loading from environment variables:", envError);
  }

  // If all else fails, generate a dummy keypair (won't have authority)
  console.warn(
    "No valid platform keys found, using dummy keypair for development. This will NOT work for production."
  );
  return Keypair.generate();
};

// Create a connection with the platform authority for server-side operations
export const getAuthConnection = (): Connection => {
  const config = getConfig();
  return new Connection(config.rpcUrl, { commitment: config.commitment });
};

// Create an anchor provider with the platform authority for server-side operations
export const getAuthProvider = (): AnchorProvider => {
  const connection = getAuthConnection();
  const keyPair = getAuthKeypair();

  console.log(`Using authority public key: ${keyPair.publicKey.toString()}`);

  // Create a provider directly without using a Wallet constructor
  return new AnchorProvider(
    connection,
    {
      publicKey: keyPair.publicKey,
      signTransaction: async (tx) => {

        // @ts-expect-error - Type issue with IDL
        tx.partialSign(keyPair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {

          // @ts-expect-error - Type issue with IDL
          tx.partialSign(keyPair);
          return tx;
        });
      },
    },
    { commitment: getConfig().commitment }
  );
};

// Get the program instance with admin authority
export const getAuthProgram = (): Program<Hashmelody> => {
  try {
    const provider = getAuthProvider();
    const config = getConfig();
    const programId = new PublicKey(config.programId);
    console.log("programId: ", programId);

    // @ts-expect-error - Type issue with IDL
    return new Program(hashmelodyIdl, provider);
  } catch (error) {
    console.error("Error creating auth program:", error);
    throw error;
  }
};
