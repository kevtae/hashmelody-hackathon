// lib/services/token/updateOracle.ts
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import type { Hashmelody } from "@/lib/idl/hashmelody";

/**
 * Update the on-chain oracle with a new view count
 * This requires authority signature
 * @param program - The Anchor program instance
 * @param mint - PublicKey of the token mint
 * @param viewCount - New view count to set
 * @returns Object with success status and transaction signature
 */
export async function updateOracleOnChain(
  program: Program<Hashmelody>,
  mint: PublicKey,
  viewCount: number
) {
  try {
    console.log(
      `Updating on-chain oracle for mint ${mint.toString()} with view count ${viewCount}`
    );

    // Ensure the program is provided
    if (!program) {
      throw new Error("Program instance is required");
    }

    // Ensure the provider is properly set up
    if (!program.provider || !program.provider.publicKey) {
      throw new Error("Program provider not initialized correctly");
    }

    // Log wallet information
    const walletPublicKey = program.provider.publicKey.toString();
    console.log("Authority public key:", walletPublicKey);

    // Convert viewCount to BN for blockchain (ensure it's a whole number)
    const viewCountBN = new BN(Math.floor(viewCount));

    // Derive PDA addresses
    const [platformConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform_config")],
      program.programId
    );

    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.toBuffer()],
      program.programId
    );

    console.log("PDAs derived:");
    console.log("- Platform Config:", platformConfig.toString());
    console.log("- Oracle:", oracle.toString());
    console.log("- Authority:", program.provider.publicKey.toString());

    // Check if oracle exists
    const oracleInfo = await program.provider.connection.getAccountInfo(oracle);
    if (!oracleInfo) {
      console.error("Oracle account does not exist");
      throw new Error(
        "Oracle account does not exist for this mint. Please initialize token first."
      );
    }

    // Verify that the current authority matches what's in the platform config
    try {
      const platformConfigAccount = await program.account.platformConfig.fetch(
        platformConfig
      );
      console.log(
        "Platform config oracle authority:",
        platformConfigAccount.oracleAuthority.toString()
      );

      // Check if current wallet is authorized
      const isAuthorized = program.provider.publicKey.equals(
        platformConfigAccount.oracleAuthority
      );
      if (!isAuthorized) {
        console.warn("WARNING: Current wallet is not the oracle authority!");
        console.warn(
          "- Current wallet:",
          program.provider.publicKey.toString()
        );
        console.warn(
          "- Required authority:",
          platformConfigAccount.oracleAuthority.toString()
        );
      }
    } catch (err) {
      console.error("Error fetching platform config:", err);
      throw new Error(
        "Could not verify authorization. Platform config not found."
      );
    }

    // Build the transaction
    const tx = await program.methods
      .updateOracle(viewCountBN)
      .accounts({
        //@ts-expect-error: some type error
        oracle,
        mint,
        platformConfig,
        authority: program.provider.publicKey,
      })
      .transaction();


    // Send the transaction
    console.log("Sending transaction...");
    //@ts-expect-error: some type error
    const signature = await program.provider.sendAndConfirm(tx);

    console.log("Oracle updated successfully!");
    console.log("Transaction signature:", signature);

    return {
      success: true,
      signature,
      error: null,
    };
  } catch (error) {
    console.error("Error updating oracle:", error);

    // Extract more detailed error if possible
    let errorMessage = "Unknown error";
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
      };

      // Handle specific error cases
      if (errorMessage.includes("UnauthorizedOracleUpdate")) {
        errorMessage =
          "You are not authorized to update the oracle. Only the platform authority can update view counts.";
      } else if (errorMessage.includes("Account not found")) {
        errorMessage =
          "Oracle account not found. The token may not be fully initialized.";
      } else if (
        errorMessage.includes("invalid account data for instruction")
      ) {
        errorMessage =
          "Invalid account data. This could be due to wrong PDA derivation or uninitialized accounts.";
      }

      // If it's an Anchor error, it may have additional properties
      if ("logs" in error) {
        // @ts-expect-error: some type error
        errorDetails.logs = error.logs;
      }
    } else {
      // If it's not an Error object
      errorDetails = { rawError: JSON.stringify(error) };
    }

    console.error("Detailed error:", errorDetails);

    return {
      success: false,
      signature: null,
      error: errorMessage,
      details: errorDetails,
    };
  }
}

/**
 * Fetches the current view count from the on-chain oracle
 */
export async function getOracleViewCount(
  program: Program<Hashmelody>,
  mint: PublicKey
): Promise<number | null> {
  try {
    // Derive oracle PDA
    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.toBuffer()],
      program.programId
    );
    // Fetch the oracle account data
    const oracleData = await program.account.viewershipOracle.fetch(oracle);

    // Return the view count as a number
    return oracleData.viewCount.toNumber();
  } catch (error) {
    console.error("Error fetching oracle view count:", error);
    return null;
  }
}

/**
 * Gets current token price from the blockchain
 */
export async function getTokenPrice(
  program: Program<Hashmelody>,
  mint: PublicKey
): Promise<{ price: number | null; error: string | null }> {
  try {
    // Derive oracle PDA
    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mint.toBuffer()],
      program.programId
    );
    // Call the getTokenPrice instruction
    const price = await program.methods
      .getTokenPrice()
      .accounts({
        mint,
        //@ts-expect-error: some type error
        oracle,
      })
      .view();

    return {
      price: price ? price.toNumber() : null,
      error: null,
    };
  } catch (error) {
    console.error("Error getting token price:", error);
    return {
      price: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
