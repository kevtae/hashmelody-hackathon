// app/api/webhook/route.ts
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { UploadsService } from "@/lib/services/supabase";
import { TokenAuthorizationStorage } from "@/lib/services/token/auth";

// Initialize QStash client
const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    console.log("Request body text:", bodyText); // Log raw body

    if (!bodyText) {
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const {
      prompt,
      userId,
      walletAddress,
      chainType,
      requestId,
      authSignature,
    } = data;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Insert prompt into database
    const uploadId = await UploadsService.insertPrompt(prompt);

    // Store token authorization if provided
    if (requestId && authSignature && walletAddress && chainType === "solana") {
      TokenAuthorizationStorage.storeAuthorization(
        requestId,
        authSignature,
        walletAddress
      );

      // Add authorization to database
      await UploadsService.updateAuthorizationInfo(uploadId, {
        requestId,
        hasAuth: true,
      });

      console.log(
        `Stored token authorization for request ID: ${requestId}, upload ID: ${uploadId}`
      );
    }

    // Queue the worker to process the request
    await qstash.publishJSON({
      url: `${process.env.PUBLIC_URL}/api/worker`,
      body: {
        prompt,
        userId,
        walletAddress,
        chainType,
        uploadId,
        requestId,
      },
      delay: 0,
    });

    console.log(
      `Queued worker for prompt: "${prompt.substring(
        0,
        30
      )}...", upload ID: ${uploadId}`
    );

    return NextResponse.json({
      message: "Music generation started",
      uploadId,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: "Failed to start music generation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
