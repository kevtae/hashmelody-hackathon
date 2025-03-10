import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import type { Hashmelody } from "@/lib/idl/hashmelody";
import idl from "@/lib/idl/hashmelody.json";
import bs58 from "bs58";
import { getNetworkConfig } from "@/lib/config/network";

const networkConfig = getNetworkConfig();
// const PROGRAM_ID = new PublicKey(networkConfig.programId);
const RPC_ENDPOINT = networkConfig.rpcUrl;

// Load the service wallet keypair (only on server side)
const loadServiceWallet = (): Keypair => {
  try {
    const base58Key = process.env.SERVICE_WALLET;
    if (!base58Key) {
      throw new Error("SERVICE_WALLET environment variable not set");
    }

    return Keypair.fromSecretKey(bs58.decode(base58Key));
  } catch (error) {
    console.error("Failed to load service wallet:", error);
    throw new Error("Service wallet configuration error");
  }
};

// Modified createTokenWithServiceWallet function to properly handle sol_vault_wallet
export async function createTokenWithServiceWallet(
  uploadId: number,
  name: string,
  musicUri: string,
  recipientAddress: string,
  solVaultWallet?: string // Optional parameter for sol vault wallet
): Promise<{ signatures: string[]; mint: string; status: string }> {
  try {
    // Validate inputs
    if (name.length > 16) {
      throw new Error("Token name must be 16 characters or less");
    }
    if (musicUri.length > 44) {
      throw new Error("Music URI must be 44 characters or less");
    }

    console.log("--- STARTING TOKEN CREATION ---");
    console.log(`Upload ID: ${uploadId}, Name: "${name}", URI: "${musicUri}"`);
    console.log(`Recipient: ${recipientAddress}`);

    // If solVaultWallet is provided, use it; otherwise use service wallet
    const solVaultAddress = solVaultWallet || null;
    if (solVaultAddress) {
      console.log(`Using custom SOL vault wallet: ${solVaultAddress}`);
    } else {
      console.log("Using service wallet as default SOL vault wallet");
    }

    // Create connection
    const connection = new Connection(RPC_ENDPOINT, "confirmed");

    // Load service wallet
    const serviceWallet = loadServiceWallet();
    console.log(`Service wallet: ${serviceWallet.publicKey.toString()}`);

    // Create the program instance
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey: serviceWallet.publicKey,
        signTransaction: async (tx) => {
          if ("partialSign" in tx) {
            tx.partialSign(serviceWallet);
          } else {
            throw new Error("Transaction type does not support partialSign");
          }
          return tx;
        },
        signAllTransactions: async (txs) => {
          return txs.map((tx) => {
            if ("partialSign" in tx) {
              tx.partialSign(serviceWallet);
            } else {
              throw new Error("Transaction type does not support partialSign");
            }
            return tx;
          });
        },
      },
      { commitment: "confirmed" }
    );

    anchor.setProvider(provider);
    const program = new Program(idl as Hashmelody, provider);

    // Derive PDAs
    const [platformConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );
    console.log(`Platform config PDA: ${platformConfig.toString()}`);

    // Ensure platform is already initialized
    let platformConfigAccount;
    try {
      platformConfigAccount = await program.account.platformConfig.fetch(
        platformConfig
      );
      console.log("Platform config found:", {
        platformWallet: platformConfigAccount.platformWallet.toString(),
        oracleAuthority: platformConfigAccount.oracleAuthority.toString(),
      });
    } catch (error) {
      console.error(
        "Platform config not found, please initialize platform first:",
        error
      );
      throw new Error("Platform not initialized");
    }

    // Create deterministic keypair for mint based on uploadId
    const mintSeed = `token-${uploadId}-v1`;
    const mintSeedBytes = new TextEncoder().encode(mintSeed);
    const hashBuffer = await crypto.subtle.digest("SHA-256", mintSeedBytes);

    const seedBytes = new Uint8Array(hashBuffer);
    const mint = Keypair.fromSeed(seedBytes.slice(0, 32));

    console.log(
      `Deterministic mint: ${mint.publicKey.toString()} for upload ID: ${uploadId}`
    );

    // Derive all PDAs
    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), mint.publicKey.toBuffer()],
      program.programId
    );
    console.log(`Mint authority PDA: ${mintAuthority.toString()}`);

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        mint.publicKey.toBuffer(),
        new anchor.BN(uploadId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    console.log(`Metadata PDA: ${metadata.toString()}`);

    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.publicKey.toBuffer()],
      program.programId
    );
    console.log(`Oracle PDA: ${oracle.toString()}`);

    const [tokenVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), mint.publicKey.toBuffer()],
      program.programId
    );
    console.log(`Token vault PDA: ${tokenVault.toString()}`);

    // Get token accounts
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      new PublicKey(recipientAddress)
    );
    console.log(`Recipient token account: ${recipientTokenAccount.toString()}`);

    const platformTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      platformConfigAccount.platformWallet
    );
    console.log(`Platform token account: ${platformTokenAccount.toString()}`);

    const vaultTokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      tokenVault,
      true
    );
    console.log(`Vault token account: ${vaultTokenAccount.toString()}`);

    // CRITICAL: Check if mint already exists
    const mintInfo = await connection.getAccountInfo(mint.publicKey);
    const initialSetupNeeded = mintInfo === null;

    // Store all transaction signatures
    const signatures: string[] = [];

    // Initialize mint if needed
    if (initialSetupNeeded) {
      console.log("Mint doesn't exist, creating it...");
      const setupInstructions = [];

      // Create mint account
      const mintRent = await connection.getMinimumBalanceForRentExemption(82);
      setupInstructions.push(
        SystemProgram.createAccount({
          fromPubkey: serviceWallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: 82,
          lamports: mintRent,
          programId: TOKEN_PROGRAM_ID,
        })
      );

      // Initialize mint with 6 decimals
      setupInstructions.push(
        createInitializeMintInstruction(
          mint.publicKey,
          6, // 6 decimals
          mintAuthority, // Authority is the PDA
          mintAuthority // Freeze authority is also the PDA
        )
      );

      const setupTx = new Transaction().add(...setupInstructions);
      const setupSig = await provider.sendAndConfirm(setupTx, [
        serviceWallet,
        mint,
      ]);
      console.log(`Mint setup successful! Signature: ${setupSig}`);
      signatures.push(setupSig);

      // Wait a moment to ensure mint is visible on chain
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      console.log("Mint already exists, skipping creation");
    }

    // Check if metadata exists to avoid duplicate token creation
    let metadataExists = false;
    try {
      const metadataInfo = await connection.getAccountInfo(metadata);
      metadataExists = metadataInfo !== null;
      if (metadataExists) {
        console.log(
          "Metadata already exists - token metadata already initialized"
        );
      }
    } catch (error) {
      console.log("Error checking metadata:", error);
    }

    // STEP 1: Initialize token metadata if not already done
    if (!metadataExists) {
      try {
        console.log("Step 1: Initializing token metadata...");
        const initMetadataSig = await program.methods
          .initializeTokenMetadata(new anchor.BN(uploadId), name, musicUri)
          .accounts({
            payer: serviceWallet.publicKey,
            mint: mint.publicKey,
            //@ts-expect-error: ignore ts error
            mintAuthority: mintAuthority,
            metadata: metadata,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(
          `Token metadata initialized! Signature: ${initMetadataSig}`
        );
        signatures.push(initMetadataSig);

        // Wait to ensure accounts are visible
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error initializing token metadata:", error);
        // Check if it's already initialized
        if (
          error instanceof Error &&
          error.message.includes("already in use")
        ) {
          console.log("Metadata already initialized, continuing...");
        } else {
          throw error;
        }
      }
    }

    // Check if oracle exists
    let oracleExists = false;
    try {
      const oracleInfo = await connection.getAccountInfo(oracle);
      oracleExists = oracleInfo !== null;
      if (oracleExists) {
        console.log("Oracle already exists - token oracle already initialized");
      }
    } catch (error) {
      console.log("Error checking oracle:", error);
    }

    // STEP 2: Initialize token oracle if not already done
    if (!oracleExists) {
      try {
        console.log("Step 2: Initializing token oracle...");
        const initOracleSig = await program.methods
          .initializeTokenOracle()
          .accounts({
            payer: serviceWallet.publicKey,
            mint: mint.publicKey,
            //@ts-expect-error: ignore ts error
            oracle: oracle,
            tokenVault: tokenVault,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        console.log(`Token oracle initialized! Signature: ${initOracleSig}`);
        signatures.push(initOracleSig);

        // Wait to ensure accounts are visible
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error("Error initializing token oracle:", error);
        // Check if it's already initialized
        if (
          error instanceof Error &&
          error.message.includes("already in use")
        ) {
          console.log("Oracle already initialized, continuing...");
        } else {
          throw error;
        }
      }
    }

    // STEP 3: Setup vault token account with proper SOL vault wallet
    try {
      const vaultTokenInfo = await connection.getAccountInfo(vaultTokenAccount);

      // Determine the SOL vault wallet to use
      const solVaultWalletPubkey = solVaultAddress
        ? new PublicKey(solVaultAddress)
        : serviceWallet.publicKey;

      if (vaultTokenInfo === null) {
        console.log("Step 3: Setting up vault token account...");
        console.log(
          `Using SOL vault wallet: ${solVaultWalletPubkey.toString()}`
        );

        // Create ATA instruction first if needed
        const createVaultAtaInst = createAssociatedTokenAccountInstruction(
          serviceWallet.publicKey,
          vaultTokenAccount,
          tokenVault,
          mint.publicKey
        );

        const createAtaTx = new Transaction().add(createVaultAtaInst);
        await provider.sendAndConfirm(createAtaTx, [serviceWallet]);

        // Now setup vault account with the specified SOL vault wallet
        const setupVaultSig = await program.methods
          .setupVaultAccount()
          .accounts({
            payer: serviceWallet.publicKey,
            mint: mint.publicKey,
            //@ts-expect-error: ignore ts error
            tokenVault: tokenVault,
            vaultTokenAccount: vaultTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        console.log(`Vault token account setup! Signature: ${setupVaultSig}`);
        signatures.push(setupVaultSig);

        // Wait to ensure accounts are visible
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log(
          "Vault token account already exists, checking vault info..."
        );

        // Check if vault account is linked to vault token account and sol_vault_wallet is set correctly
        try {
          const tokenVaultInfo = await program.account.tokenVault.fetch(
            tokenVault
          );

          console.log(
            "Current vault token account:",
            tokenVaultInfo.vaultAccount.toString()
          );
          console.log(
            "Current SOL vault wallet:",
            tokenVaultInfo.solVaultWallet?.toString() || "Not set"
          );

          const vaultAccountMatches =
            tokenVaultInfo.vaultAccount.equals(vaultTokenAccount);
          const solVaultMatches = tokenVaultInfo.solVaultWallet
            ? tokenVaultInfo.solVaultWallet.equals(solVaultWalletPubkey)
            : false;

          if (!vaultAccountMatches || !solVaultMatches) {
            console.log(
              "Vault needs to be updated with correct information..."
            );
            const setupVaultSig = await program.methods
              .setupVaultAccount()
              .accounts({
                payer: serviceWallet.publicKey,
                mint: mint.publicKey,
                //@ts-expect-error: ignore ts error
                tokenVault: tokenVault,
                vaultTokenAccount: vaultTokenAccount,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
              })
              .rpc();
            console.log(
              `Vault token account updated! Signature: ${setupVaultSig}`
            );
            signatures.push(setupVaultSig);
          } else {
            console.log(
              "Vault token account and SOL vault wallet already properly set, skipping step 3"
            );
          }
        } catch (error) {
          console.error("Error checking token vault data:", error);
          // Try to update the vault anyway
          const setupVaultSig = await program.methods
            .setupVaultAccount()
            .accounts({
              payer: serviceWallet.publicKey,
              mint: mint.publicKey,
              //@ts-expect-error: ignore ts error
              tokenVault: tokenVault,
              vaultTokenAccount: vaultTokenAccount,
              tokenProgram: TOKEN_PROGRAM_ID,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc();
          console.log(
            `Vault token account updated! Signature: ${setupVaultSig}`
          );
          signatures.push(setupVaultSig);
        }
      }
    } catch (error) {
      console.error("Error setting up vault token account:", error);
      throw error;
    }

    // STEP 4: Setup user token accounts
    try {
      // Check if user and platform token accounts exist
      const userTokenInfo = await connection.getAccountInfo(
        recipientTokenAccount
      );
      const platformTokenInfo = await connection.getAccountInfo(
        platformTokenAccount
      );

      const setupUserAccountsNeeded =
        userTokenInfo === null || platformTokenInfo === null;

      if (setupUserAccountsNeeded) {
        console.log("Step 4: Setting up user token accounts...");

        // Create ATAs if needed
        const setupInstructions = [];

        if (userTokenInfo === null) {
          setupInstructions.push(
            createAssociatedTokenAccountInstruction(
              serviceWallet.publicKey,
              recipientTokenAccount,
              new PublicKey(recipientAddress),
              mint.publicKey
            )
          );
        }

        if (platformTokenInfo === null) {
          setupInstructions.push(
            createAssociatedTokenAccountInstruction(
              serviceWallet.publicKey,
              platformTokenAccount,
              platformConfigAccount.platformWallet,
              mint.publicKey
            )
          );
        }

        if (setupInstructions.length > 0) {
          const setupAtaTx = new Transaction().add(...setupInstructions);
          const setupAtaSig = await provider.sendAndConfirm(setupAtaTx, [
            serviceWallet,
          ]);
          console.log(`User token accounts created! Signature: ${setupAtaSig}`);
          signatures.push(setupAtaSig);
        }

        // Now run the program instruction
        const setupUserSig = await program.methods
          .setupUserAccounts()
          .accounts({
            payer: serviceWallet.publicKey,
            //@ts-expect-error: ignore ts error
            platformConfig: platformConfig,
            platformWallet: platformConfigAccount.platformWallet,
            mint: mint.publicKey,
            tokenAccount: recipientTokenAccount,
            platformTokenAccount: platformTokenAccount,
            recipient: new PublicKey(recipientAddress),
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        console.log(`User accounts setup! Signature: ${setupUserSig}`);
        signatures.push(setupUserSig);

        // Wait to ensure accounts are visible
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        console.log("User token accounts already exist, skipping step 4");
      }
    } catch (error) {
      console.error("Error setting up user token accounts:", error);
      throw error;
    }

    // Check if tokens are already minted
    const userTokenInfo = await connection.getAccountInfo(
      recipientTokenAccount
    );
    if (userTokenInfo && userTokenInfo.data.length > 0) {
      // Check token balance
      try {
        const tokenBalance = await connection.getTokenAccountBalance(
          recipientTokenAccount
        );
        if (tokenBalance.value.uiAmount && tokenBalance.value.uiAmount > 0) {
          console.log(
            `Tokens already minted to user: ${tokenBalance.value.uiAmount}`
          );
          return {
            signatures,
            mint: mint.publicKey.toString(),
            status: "already_minted",
          };
        }
      } catch (error) {
        console.log("Error checking token balance:", error);
      }
    }

    // STEP 5: Mint tokens
    try {
      console.log("Step 5: Minting tokens...");
      const mintSig = await program.methods
        .mintToken()
        .accounts({
          payer: serviceWallet.publicKey,
          //@ts-expect-error: ignore ts error
          mintAuthority: mintAuthority,
          mint: mint.publicKey,
          tokenAccount: recipientTokenAccount,
          platformTokenAccount: platformTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      console.log(`Tokens minted successfully! Signature: ${mintSig}`);
      signatures.push(mintSig);
    } catch (error) {
      console.error("Error minting tokens:", error);

      // Check if tokens were already minted
      try {
        const tokenBalance = await connection.getTokenAccountBalance(
          recipientTokenAccount
        );
        if (tokenBalance.value.uiAmount && tokenBalance.value.uiAmount > 0) {
          console.log(
            `Tokens already minted to user: ${tokenBalance.value.uiAmount}`
          );
          return {
            signatures,
            mint: mint.publicKey.toString(),
            status: "already_minted",
          };
        } else {
          throw error;
        }
      } catch (balanceError) {
        console.error("Error checking token balance:", balanceError);
        throw error;
      }
    }

    // Verify the SOL vault wallet was set correctly
    try {
      const tokenVaultInfo = await program.account.tokenVault.fetch(tokenVault);
      console.log(
        "Final SOL vault wallet:",
        tokenVaultInfo.solVaultWallet.toString()
      );
    } catch (error) {
      console.warn("Failed to verify final SOL vault wallet:", error);
    }

    console.log("Token creation completed successfully!");
    return {
      signatures,
      mint: mint.publicKey.toString(),
      status: "success",
    };
  } catch (error) {
    console.error("Error creating token with service wallet:", error);
    throw error;
  }
}
