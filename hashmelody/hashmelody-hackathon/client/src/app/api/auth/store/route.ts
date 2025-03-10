import { NextRequest, NextResponse } from "next/server";
import { TokenAuthorizationStorage } from "@/lib/services/token/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received authorization request body:", {
      hasRequestId: !!body.requestId,
      hasSignature: !!body.signature,
      hasWalletAddress: !!body.walletAddress,
      requestId: body.requestId,
      walletAddress: body.walletAddress,
      signaturePreview: body.signature ? body.signature.substring(0, 10) + "..." : 'none'
    });

    const { requestId, signature, walletAddress } = body;

    // Validate required fields
    const missingFields = [];
    if (!requestId) missingFields.push('requestId');
    if (!signature) missingFields.push('signature');
    if (!walletAddress) missingFields.push('walletAddress');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", missingFields },
        { status: 400 }
      );
    }

    try {
      // Store the authorization
      await TokenAuthorizationStorage.storeAuthorization(requestId, signature, walletAddress);

      // Get the stored authorization to verify
      const storedAuth = await TokenAuthorizationStorage.getAuthorization(requestId);
      
      if (!storedAuth) {
        return NextResponse.json(
          { error: "Failed to store authorization" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        stored: true,
        requestId,
        timestamp: storedAuth.timestamp
      });

    } catch (storageError) {
      if (storageError instanceof Error) {
        console.error("Storage operation failed:", storageError);
        return NextResponse.json(
          { error: "Database operation failed", details: storageError.message },
          { status: 500 }
        );
      } else {
        console.error("Storage operation failed with unknown error:", storageError);
        return NextResponse.json(
          { error: "Database operation failed", details: "Unknown error" },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error("Error in request handling:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}