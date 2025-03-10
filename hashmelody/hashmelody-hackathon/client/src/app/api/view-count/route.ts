// app/api/view-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  updateViewCount,
  batchUpdateViewCounts,
} from "@/lib/services/token/viewCount";
import { getAuthProgram } from "@/lib/solana/connection";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] View count API called");
    const body = await request.json();
    const { uploadId, viewCount, updateOnChain = false } = body;

    console.log("[API] Request body:", {
      uploadId,
      viewCount,
      updateOnChain,
    });

    // Validate inputs
    if (!uploadId || isNaN(uploadId)) {
      console.warn("[API] Invalid uploadId:", uploadId);
      return NextResponse.json({ error: "Invalid uploadId" }, { status: 400 });
    }

    if (viewCount === undefined || isNaN(viewCount) || viewCount < 0) {
      console.warn("[API] Invalid viewCount:", viewCount);
      return NextResponse.json({ error: "Invalid viewCount" }, { status: 400 });
    }

    // Get the program with authority
    console.log("[API] Getting authorized program...");
    let program;
    try {
      program = getAuthProgram();
      console.log("[API] Program initialized successfully");
      if (!program?.provider?.publicKey) {
        throw new Error("Program provider or publicKey is undefined");
      }
      console.log(
        "[API] Using wallet address:",
        program.provider.publicKey.toString()
      );
    } catch (programError) {
      console.error("[API] Failed to get authorized program:", programError);
      return NextResponse.json(
        {
          error: "Program initialization failed",
          details:
            programError instanceof Error
              ? programError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Update the view count
    console.log(
      `[API] Updating view count for upload ${uploadId} to ${viewCount} (updateOnChain: ${updateOnChain})`
    );
    const result = await updateViewCount(
      program,
      parseInt(uploadId.toString()),
      parseInt(viewCount.toString()),
      updateOnChain
    );

    console.log("[API] Update result:", JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Error in view count update API:", error);

    // Create a detailed error response
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };

    console.error(
      "[API] Error response:",
      JSON.stringify(errorResponse, null, 2)
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("[API] Batch view count update API called");
    const body = await request.json();
    const { updateOnChain = false } = body;

    console.log("[API] Request body:", {
      updateOnChain,
    });

    // Get the program with authority
    console.log("[API] Getting authorized program...");
    let program;
    try {
      program = getAuthProgram();
      console.log("[API] Program initialized successfully");
      if (!program?.provider?.publicKey) {
        throw new Error("Program provider or publicKey is undefined");
      }
      console.log(
        "[API] Using wallet address:",
        program.provider.publicKey.toString()
      );
    } catch (programError) {
      console.error("[API] Failed to get authorized program:", programError);
      return NextResponse.json(
        {
          error: "Program initialization failed",
          details:
            programError instanceof Error
              ? programError.message
              : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Perform batch update
    console.log(
      `[API] Performing batch update (updateOnChain: ${updateOnChain})`
    );
    const result = await batchUpdateViewCounts(program, updateOnChain);

    console.log("[API] Batch update result summary:", result.summary);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[API] Error in batch view count update API:", error);

    // Create a detailed error response
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };

    console.error(
      "[API] Error response:",
      JSON.stringify(errorResponse, null, 2)
    );

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
