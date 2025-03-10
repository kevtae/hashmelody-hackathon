// Update view count in Supabase database
import { supabase } from "@/lib/services/supabase/client";
import { updateOracleOnChain } from "@/lib/services/token/updateOracle";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Hashmelody } from "@/lib/idl/hashmelody";

/**
 * Update the view count for a specific music token
 *
 * @param program - The Anchor program instance
 * @param uploadId - The ID of the upload in Supabase
 * @param viewCount - The new view count to set
 * @param updateOracleOnChain - Whether to also update the on-chain oracle (requires authority signature)
 * @returns An object containing the status of the update operation
 */
export async function updateViewCount(
  program: Program<Hashmelody>,
  uploadId: number,
  viewCount: number,
  updateOnChain: boolean = true
) {
  try {
    // 1. First update the view count in the database
    const { data, error } = await supabase
      .from("uploads")
      .update({ view_count: viewCount })
      .eq("id", uploadId)
      .select("token_mint, view_count")
      .single();

    if (error) {
      console.error("Error updating view count in database:", error);
      return {
        success: false,
        error: error.message,
        databaseUpdated: false,
        onChainUpdated: false,
      };
    }

    // 2. If requested, also update the on-chain oracle
    let onChainResult = { success: false, signature: null, error: null };

    if (updateOnChain && data?.token_mint) {
      try {
        const mintAddress = new PublicKey(data.token_mint);
        //@ts-expect-error: ignore ts error
        onChainResult = await updateOracleOnChain(
          program,
          mintAddress,
          viewCount
        );
      } catch (err) {
        console.error("Error updating on-chain oracle:", err);
        //@ts-expect-error: ignore ts error
        onChainResult.error =
          err instanceof Error ? err.message : "Unknown error";
      }
    }

    return {
      success: true,
      databaseUpdated: true,
      onChainUpdated: onChainResult.success,
      data: {
        uploadId,
        mintAddress: data?.token_mint,
        viewCount: data?.view_count,
        onChainSignature: onChainResult.signature,
      },
    };
  } catch (error) {
    console.error("Unexpected error in updateViewCount:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      databaseUpdated: false,
      onChainUpdated: false,
    };
  }
}

/**
 * Batch update view counts based on popularity metrics
 *
 * @param program - The Anchor program instance
 * @param updateOnChain - Whether to also update on-chain oracles
 * @returns Summary of the update operation
 */
export async function batchUpdateViewCounts(
  program: Program<Hashmelody>,
  updateOnChain: boolean = false
) {
  try {
    // 1. Get all music with token_mint but missing view counts
    const { data: uploads, error } = await supabase
      .from("uploads")
      .select("id, title, token_mint, view_count")
      .not("token_mint", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch music data: ${error.message}`);
    }

    // 2. Process each upload
    const results = [];
    const updatedCount = {
      total: uploads.length,
      databaseUpdated: 0,
      onChainUpdated: 0,
      errors: 0,
    };

    for (const upload of uploads) {
      // Skip items that already have a view count
      //@ts-expect-error: ignore ts error
      if (upload.view_count && upload.view_count > 0) {
        results.push({
          id: upload.id,
          title: upload.title,
          status: "skipped",
          reason: "already has view count",
          currentCount: upload.view_count,
        });
        continue;
      }

      // Calculate a view count based on some algorithm
      // For example: random between 1000-10000
      const newViewCount = Math.floor(Math.random() * 9000) + 1000;

      try {
        // Update this specific upload
        const result = await updateViewCount(
          program,
          //@ts-expect-error: ignore ts error
          upload.id,
          newViewCount,
          updateOnChain
        );

        if (result.success) {
          updatedCount.databaseUpdated++;
          if (result.onChainUpdated) updatedCount.onChainUpdated++;

          results.push({
            id: upload.id,
            title: upload.title,
            status: "updated",
            newCount: newViewCount,
            onChainUpdated: result.onChainUpdated,
          });
        } else {
          updatedCount.errors++;
          results.push({
            id: upload.id,
            title: upload.title,
            status: "error",
            error: result.error,
          });
        }
      } catch (err) {
        updatedCount.errors++;
        results.push({
          id: upload.id,
          title: upload.title,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      // Add a small delay between updates to avoid rate limits
      if (updateOnChain) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      summary: updatedCount,
      details: results,
    };
  } catch (error) {
    console.error("Error in batch update:", error);
    throw error;
  }
}
