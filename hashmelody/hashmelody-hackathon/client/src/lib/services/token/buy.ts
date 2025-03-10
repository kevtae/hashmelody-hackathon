import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { Hashmelody } from "@/lib/idl/hashmelody";

export async function buyToken(
  program: Program<Hashmelody>,
  mint: PublicKey,
  amountTokens: number
) {
  try {
    const provider = program.provider as AnchorProvider;
    const buyer = provider.wallet.publicKey;

    // Convert amountTokens to integer if it's not already
    const tokenAmount = Math.floor(amountTokens * 100) / 100; // Limit to 2 decimal places

    console.log("Starting token purchase with debug info...");
    console.log("Mint:", mint.toString());
    console.log("Buyer:", buyer.toString());
    console.log("Amount:", tokenAmount);

    // Derive PDAs first (we need these for price checks)
    const [platformConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), mint.toBuffer()],
      program.programId
    );

    const [tokenVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), mint.toBuffer()],
      program.programId
    );

    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.toBuffer()],
      program.programId
    );

    console.log("DEBUG PDAs:");
    console.log("Platform Config PDA:", platformConfig.toString());
    console.log("Mint Authority PDA:", mintAuthority.toString());
    console.log("Token Vault PDA:", tokenVault.toString());
    console.log("Oracle PDA:", oracle.toString());

    // Try to get the current token price using the getTokenPrice instruction
    let pricePerToken = 1_000_000; // Default minimum price (0.001 SOL)
    try {
      // Get the current token price directly from the blockchain if available
      const priceResult = await program.methods
        .getTokenPrice()
        .accounts({
          mint,
          //@ts-expect-error: some type script error
          oracle,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .view();

      // If successful, use the returned price
      if (priceResult) {
        pricePerToken = Number(priceResult);
        console.log("Token price from contract:", pricePerToken);
      }
    } catch (err) {
      console.warn(
        "Could not get token price from contract, using minimum price:",
        err
      );
    }

    // Calculate exact costs like the contract does
    const totalRawCost = pricePerToken * tokenAmount;
    const platformFee = Math.ceil((totalRawCost * 25) / 1000); // 2.5% rounded up
    const vaultAmount = totalRawCost - platformFee;
    const txFee = 10000; // 0.00001 SOL for transaction fee
    const rentBuffer = 890880; // Rent exempt minimum for safety

    // Total cost with all components and a 10% safety buffer
    const requiredBalance = Math.ceil(
      (totalRawCost + platformFee + txFee + rentBuffer) * 1.1
    );

    // Log detailed cost breakdown
    console.log("Cost breakdown:");
    console.log("- Price per token:", pricePerToken, "lamports");
    console.log("- Raw cost for tokens:", totalRawCost, "lamports");
    console.log("- Platform fee (2.5%):", platformFee, "lamports");
    console.log("- Vault amount:", vaultAmount, "lamports");
    console.log("- Transaction fee:", txFee, "lamports");
    console.log("- Rent buffer:", rentBuffer, "lamports");
    console.log(
      "- Total required (with 10% buffer):",
      requiredBalance,
      "lamports"
    );

    // Check buyer's balance with the detailed calculation
    try {
      const balance = await program.provider.connection.getBalance(buyer);
      console.log(
        `Buyer balance: ${balance} lamports (${balance / 1_000_000_000} SOL)`
      );

      console.log("Exact Solana balance check:", {
        actualBalance: balance,
        totalCost: totalRawCost,
        difference: balance - totalRawCost,
        hasEnough: balance >= totalRawCost,
      });

      if (balance < requiredBalance) {
        throw new Error(
          `Insufficient funds. You have ${
            balance / 1_000_000_000
          } SOL, but need at least ${
            requiredBalance / 1_000_000_000
          } SOL (${tokenAmount} tokens at ${
            pricePerToken / 1_000_000_000
          } SOL each plus fees)`
        );
      }
    } catch (err) {
      console.error("Error checking balance:", err);
      throw err;
    }

    // Verify PDAs exist
    try {
      console.log("Checking if PDAs exist...");
      const platformConfigInfo =
        await program.provider.connection.getAccountInfo(platformConfig);
      console.log(`Platform Config exists: ${!!platformConfigInfo}`);

      const oracleInfo = await program.provider.connection.getAccountInfo(
        oracle
      );
      console.log(`Oracle exists: ${!!oracleInfo}`);

      const tokenVaultInfo = await program.provider.connection.getAccountInfo(
        tokenVault
      );
      console.log(`Token Vault exists: ${!!tokenVaultInfo}`);

      if (!platformConfigInfo || !oracleInfo || !tokenVaultInfo) {
        throw new Error(
          "Required PDAs do not exist. Please initialize the token properly first."
        );
      }
    } catch (err) {
      console.error("Error checking PDAs:", err);
      throw new Error("Failed to verify required program accounts");
    }

    // Get platform config data
    let platformWallet: PublicKey;
    try {
      console.log("Fetching platform config data...");
      const configData = await program.account.platformConfig.fetch(
        platformConfig
      );
      platformWallet = configData.platformWallet;
      console.log("Platform Wallet:", platformWallet.toString());
    } catch (err) {
      console.error("Error fetching platform config:", err);
      throw new Error("Failed to fetch platform configuration");
    }

    // Get SOL vault wallet from token vault
    let solVaultWallet: PublicKey;
    try {
      console.log("Fetching token vault data to get solVaultWallet...");
      const tokenVaultData = await program.account.tokenVault.fetch(tokenVault);
      solVaultWallet = tokenVaultData.solVaultWallet;
      console.log("SOL Vault Wallet:", solVaultWallet.toString());

      // Check if wallet addresses are the same
      if (solVaultWallet.equals(platformWallet)) {
        console.log(
          "WARNING: Platform wallet and SOL vault wallet are the same address"
        );
      }

      if (!solVaultWallet) {
        throw new Error("solVaultWallet not set in token vault");
      }
    } catch (err) {
      console.error("Error fetching token vault data:", err);
      throw new Error(
        "Failed to fetch token vault data to determine SOL vault wallet"
      );
    }

    // Get ATA addresses
    const buyerAta = getAssociatedTokenAddressSync(mint, buyer, false);
    const vaultAta = getAssociatedTokenAddressSync(mint, tokenVault, true);

    console.log("Token Accounts:");
    console.log("Buyer ATA:", buyerAta.toString());
    console.log("Vault ATA:", vaultAta.toString());

    // Check if buyer's ATA exists, create it if it doesn't
    const instructions: web3.TransactionInstruction[] = [];

    try {
      const ataInfo = await program.provider.connection.getAccountInfo(
        buyerAta
      );
      if (!ataInfo) {
        console.log("Creating ATA instruction");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          buyer,
          buyerAta,
          buyer,
          mint
        );
        instructions.push(createAtaIx);
      } else {
        console.log("Buyer ATA already exists");
      }
    } catch (error) {
      console.error("Error checking ATA:", error);
      console.log("Creating ATA instruction as fallback");
      const createAtaIx = createAssociatedTokenAccountInstruction(
        buyer,
        buyerAta,
        buyer,
        mint
      );
      instructions.push(createAtaIx);
    }

    // Calculate token amount in mint units
    const tokenDecimals = 6;
    const decimalMultiplier = 10 ** tokenDecimals;
    const tokensToMint = new BN(Math.round(tokenAmount * decimalMultiplier));

    console.log("Detailed transaction info:");
    console.log("- Tokens requested:", tokenAmount);
    console.log("- Tokens in mint units:", tokensToMint.toString());

    // Build transaction
    console.log("Building transaction...");
    console.log("Arguments for purchaseToken:");
    console.log("- Token amount:", tokensToMint.toString());

    console.log("Accounts for purchaseToken:");
    console.log("- buyer:", buyer.toString());
    console.log("- solVaultWallet:", solVaultWallet.toString());
    console.log("- platformConfig:", platformConfig.toString());
    console.log("- platformWallet:", platformWallet.toString());
    console.log("- mintAuthority:", mintAuthority.toString());
    console.log("- mint:", mint.toString());
    console.log("- buyerTokenAccount:", buyerAta.toString());
    console.log("- tokenVault:", tokenVault.toString());
    console.log("- vaultTokenAccount:", vaultAta.toString());
    console.log("- oracle:", oracle.toString());
    console.log("- systemProgram:", web3.SystemProgram.programId.toString());
    console.log("- tokenProgram:", TOKEN_PROGRAM_ID.toString());
    console.log(
      "- associatedTokenProgram:",
      ASSOCIATED_TOKEN_PROGRAM_ID.toString()
    );
    console.log("- rent:", web3.SYSVAR_RENT_PUBKEY.toString());

    let txBuilder = program.methods.purchaseToken(tokensToMint).accounts({
      buyer,
      solVaultWallet,
      //@ts-expect-error: some type script error
      platformConfig,
      platformWallet,
      mintAuthority,
      mint,
      buyerTokenAccount: buyerAta,
      tokenVault,
      vaultTokenAccount: vaultAta,
      oracle,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    });

    // Add any needed instructions
    if (instructions.length > 0) {
      console.log(`Adding ${instructions.length} instructions to transaction`);
      txBuilder = txBuilder.preInstructions(instructions);
    }

    // Try to simulate the transaction first
    console.log("Attempting to simulate transaction...");
    try {
      const tx = await txBuilder.transaction();
      tx.feePayer = provider.wallet.publicKey;

      // Add recent blockhash
      // const { blockhash, lastValidBlockHeight } =
      const { blockhash } =
        await program.provider.connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;

      // Simulate transaction
      const simulation = await program.provider.connection.simulateTransaction(
        tx
      );

      // Add this to your buy function right after simulating the transaction
      if (simulation.value.logs) {
        const totalCostLog = simulation.value.logs.find((log) =>
          log.includes("Total cost:")
        );
        if (totalCostLog) {
          console.log("Contract calculated total cost:", totalCostLog);
        }
      }

      console.log("Raw simulation result:", simulation);

      if (simulation.value.err) {
        console.error("Simulation error details:", {
          error: simulation.value.err,
          logs: simulation.value.logs,
          unitsConsumed: simulation.value.unitsConsumed,
        });

        // Extract helpful information from logs
        if (simulation.value.logs) {
          const errorLogs = simulation.value.logs.filter(
            (log) =>
              log.includes("Error") ||
              log.includes("error") ||
              log.includes("AnchorError")
          );
          console.error("Error logs:", errorLogs);

          // Check for specific error messages
          if (errorLogs.some((log) => log.includes("InsufficientFunds"))) {
            throw new Error(
              "Insufficient funds error detected during simulation. " +
                "Please make sure you have enough SOL for the transaction."
            );
          }
        }

        // Log the full transaction details for debugging
        console.log("Transaction details:", {
          feePayer: tx.feePayer?.toBase58(),
          instructions: tx.instructions.map((ix) => ({
            programId: ix.programId.toBase58(),
            keys: ix.keys.map((k) => ({
              pubkey: k.pubkey.toBase58(),
              isSigner: k.isSigner,
              isWritable: k.isWritable,
            })),
          })),
        });

        throw new Error("Transaction simulation failed. See logs for details.");
      } else {
        console.log("Simulation successful!");
        console.log("- Units consumed:", simulation.value.unitsConsumed);
        console.log("- Logs:", simulation.value.logs);
      }
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Please make sure you have enough SOL")
      ) {
        throw err; // Re-throw our custom insufficient funds error
      }

      console.error("Simulation failed with error:", err);
      // Don't proceed if simulation failed with insufficient funds
      if (
        err instanceof Error &&
        (err.message.includes("InsufficientFunds") ||
          err.message.includes("insufficient funds"))
      ) {
        throw new Error(
          "Insufficient funds detected during simulation. " +
            "Please try with fewer tokens or add more SOL to your wallet."
        );
      }
      // Continue with the transaction for other errors
      console.warn("Proceeding with transaction despite simulation errors");
    }

    // Set transaction options with preflight checks enabled
    const options = {
      skipPreflight: false,
      commitment: "confirmed" as web3.Commitment,
      preflightCommitment: "confirmed" as web3.Commitment,
      maxRetries: 3,
    };

    // Send the transaction
    console.log("Sending transaction with options:", options);
    const txSignature = await txBuilder.rpc(options);
    console.log("Transaction sent! Signature:", txSignature);

    // Wait for confirmation
    const confirmation = await program.provider.connection.confirmTransaction({
      signature: txSignature,
      ...(await program.provider.connection.getLatestBlockhash()),
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    return txSignature;
  } catch (error) {
    console.error("Error buying token:", error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      if (typeof error === "object" && error !== null && "logs" in error) {
        console.error("Transaction logs:", (error as { logs: string[] }).logs);
      }

      if (
        error.message.includes("InsufficientFunds") ||
        error.message.includes("insufficient funds")
      ) {
        throw new Error(
          "Insufficient funds to complete the purchase. Please ensure you have enough SOL to cover the token price and transaction fees."
        );
      }
    }
    throw error;
  }
}

/**
 * Modified function to purchase a single token with increased balance protection
 */
export async function purchaseSingleToken(
  program: Program<Hashmelody>,
  mint: PublicKey
) {
  try {
    const provider = program.provider as AnchorProvider;
    const buyer = provider.wallet.publicKey;

    // Hard-coded to purchase exactly 1 token
    // const tokenAmount = 1;

    console.log("Starting SINGLE token purchase with debug info...");
    console.log("Mint:", mint.toString());
    console.log("Buyer:", buyer.toString());
    console.log("Amount: 1 token only");

    // Derive PDAs
    const [platformConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint_authority"), mint.toBuffer()],
      program.programId
    );

    const [tokenVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), mint.toBuffer()],
      program.programId
    );

    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.toBuffer()],
      program.programId
    );

    // Get buyer's balance
    const balance = await program.provider.connection.getBalance(buyer);
    console.log(
      `Buyer balance: ${balance} lamports (${balance / 1_000_000_000} SOL)`
    );

    // Hard-coded minimum balance requirement with extreme safety buffer
    // This should be far more than needed for 1 token
    const minimumRequired = 10_000_000; // 0.01 SOL (10x the minimum token price)

    if (balance < minimumRequired) {
      throw new Error(
        `Insufficient balance for this test purchase. Need at least 0.01 SOL.`
      );
    }

    // Get platform config data
    const configData = await program.account.platformConfig.fetch(
      platformConfig
    );
    const platformWallet = configData.platformWallet;

    // Get SOL vault wallet from token vault
    const tokenVaultData = await program.account.tokenVault.fetch(tokenVault);
    const solVaultWallet = tokenVaultData.solVaultWallet;

    // Get ATA addresses
    const buyerAta = getAssociatedTokenAddressSync(mint, buyer, false);
    const vaultAta = getAssociatedTokenAddressSync(mint, tokenVault, true);

    // Check if buyer's ATA exists, create it if it doesn't
    const instructions: web3.TransactionInstruction[] = [];
    try {
      const ataInfo = await program.provider.connection.getAccountInfo(
        buyerAta
      );
      if (!ataInfo) {
        console.log("Creating ATA instruction");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          buyer,
          buyerAta,
          buyer,
          mint
        );
        instructions.push(createAtaIx);
      }
    } catch {
      console.log("Creating ATA instruction as fallback");
      const createAtaIx = createAssociatedTokenAccountInstruction(
        buyer,
        buyerAta,
        buyer,
        mint
      );
      instructions.push(createAtaIx);
    }

    // Calculate token amount in mint units - exactly 1 token
    const tokenDecimals = 6;
    const decimalMultiplier = 10 ** tokenDecimals;
    const tokensToMint = new BN(decimalMultiplier); // 1 token with 6 decimals

    console.log("Building transaction for 1 token purchase");

    let txBuilder = program.methods.purchaseToken(tokensToMint).accounts({
      buyer,
      solVaultWallet,
      //@ts-expect-error: some type script error
      platformConfig,
      platformWallet,
      mintAuthority,
      mint,
      buyerTokenAccount: buyerAta,
      tokenVault,
      vaultTokenAccount: vaultAta,
      oracle,
      systemProgram: web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: web3.SYSVAR_RENT_PUBKEY,
    });

    if (instructions.length > 0) {
      txBuilder = txBuilder.preInstructions(instructions);
    }

    // Modify transaction options to use a higher compute limit
    const options = {
      skipPreflight: false, // We still want preflight checks
      commitment: "confirmed" as web3.Commitment,
      preflightCommitment: "confirmed" as web3.Commitment,
      maxRetries: 5,
      computeUnits: 300000, // Try with higher compute budget
    };

    console.log("Sending transaction with modified options");
    const txSignature = await txBuilder.rpc(options);
    console.log("Transaction sent! Signature:", txSignature);

    // Wait for confirmation
    const confirmation = await program.provider.connection.confirmTransaction({
      signature: txSignature,
      ...(await program.provider.connection.getLatestBlockhash()),
    });

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    return txSignature;
  } catch (error) {
    console.error("Error buying single token:", error);
    throw error;
  }
}

// Helper function to validate inputs
export function validateBuyInputs(
  program: Program<Hashmelody> | null,
  mint: string | null,
  amount: number
): string | null {
  if (!program) {
    return "Program not initialized";
  }

  if (!mint) {
    return "Invalid mint address";
  }

  try {
    new PublicKey(mint);
  } catch {
    return "Invalid mint address format";
  }

  if (isNaN(amount) || amount <= 0) {
    return "Please enter a valid amount greater than 0";
  }

  // Add additional validation for reasonable purchase amounts
  if (amount > 1000) {
    return "Purchase amount seems unusually high. Please enter a smaller amount.";
  }

  return null;
}
