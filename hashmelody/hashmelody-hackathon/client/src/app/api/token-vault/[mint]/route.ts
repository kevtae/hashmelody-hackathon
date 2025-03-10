// File: /app/api/token-vault/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "@/lib/idl/hashmelody.json";
import { getNetworkConfig } from "@/lib/config/network";
import type { Hashmelody } from "@/lib/idl/hashmelody";

export async function GET(req: NextRequest) {
  try {
    console.log("token-vault called");
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const mintAddress = segments[segments.length - 1];

    console.log("Request URL:", req.url);
    console.log("URL segments:", segments);
    console.log("Extracted mintAddress:", mintAddress);

    const networkConfig = getNetworkConfig();
    console.log(`Using network: ${process.env.SOLANA_NETWORK || "localnet"}`);
    console.log(`Network config: ${JSON.stringify(networkConfig, null, 2)}`);

    if (!mintAddress) {
      return NextResponse.json(
        { error: "Mint address is required" },
        { status: 400 }
      );
    }

    console.log(`API Fetching token vault data for mint: ${mintAddress}`);

    // Validate mint address
    let mintPubkey: PublicKey;
    try {
      mintPubkey = new PublicKey(mintAddress);
    } catch (error) {
      console.error("[API] Invalid mint address error:", error);
      return NextResponse.json(
        { error: "Invalid mint address format" },
        { status: 400 }
      );
    }

    // Create connection
    const connection = new Connection(networkConfig.rpcUrl, "confirmed");
    console.log(`[API] Using RPC URL: ${networkConfig.rpcUrl}`);

    // Create program instance
    const programId = new PublicKey(networkConfig.programId);
    console.log(`[API] Using Program ID: ${programId.toString()}`);

    // Check if program account exists
    const programInfo = await connection.getAccountInfo(programId);
    console.log("[API] Program account exists:", !!programInfo);
    if (!programInfo) {
      console.error("[API] Program account not found!");
      return NextResponse.json(
        { error: "Program not found on network" },
        { status: 404 }
      );
    }

    // Check if mint account exists
    const mintInfo = await connection.getAccountInfo(mintPubkey);
    console.log("[API] Mint account exists:", !!mintInfo);
    if (mintInfo) {
      console.log("[API] Mint account owner:", mintInfo.owner.toString());
      console.log("[API] Mint account data length:", mintInfo.data.length);
    }

    if (!mintInfo) {
      console.log(`[API] Mint account not found: ${mintPubkey.toString()}`);
      return NextResponse.json(
        { error: "Mint account not found" },
        { status: 404 }
      );
    }

    // Derive token vault PDA
    const [tokenVaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_vault"), mintPubkey.toBuffer()],
      programId
    );

    console.log(`[API] Token Vault PDA: ${tokenVaultPDA.toString()}`);
    console.log(`[API] Mint: ${mintPubkey.toString()}`);

    // Check if token vault account exists
    const tokenVaultInfo = await connection.getAccountInfo(tokenVaultPDA);
    console.log("[API] Token Vault account exists:", !!tokenVaultInfo);
    if (tokenVaultInfo) {
      console.log(
        "[API] Token Vault account data length:",
        tokenVaultInfo.data.length
      );
      console.log(
        "[API] Token Vault account owner:",
        tokenVaultInfo.owner.toString()
      );
    }

    if (!tokenVaultInfo) {
      console.log(
        `[API] Token Vault account doesn't exist: ${tokenVaultPDA.toString()}`
      );
      return NextResponse.json(
        { error: "Token Vault account not found" },
        { status: 404 }
      );
    }

    // Create program instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = new AnchorProvider(connection, {} as any, {
      commitment: "confirmed",
    });
    const program = new Program(idl as Hashmelody, provider);

    try {
      // Fetch token vault data
      console.log("[API] Fetching and validating token vault data");
      const tokenVaultAccount = await program.account.tokenVault.fetch(
        tokenVaultPDA
      );

      console.log("[API] Token Vault data validation:", {
        mint: tokenVaultAccount.mint.toString(),
        solVaultWallet: tokenVaultAccount.solVaultWallet.toString(),
        liquidityThreshold: tokenVaultAccount.liquidityThreshold.toString(),
        bump: tokenVaultAccount.bump,
      });

      // Validate the mint in the token vault matches our mint
      if (!tokenVaultAccount.mint.equals(mintPubkey)) {
        console.error(
          "[API] Token Vault's mint doesn't match the provided mint!"
        );
        throw new Error("Token Vault data validation failed: mint mismatch");
      }

      // Get SOL balance for the SOL vault wallet
      const solVaultWallet = tokenVaultAccount.solVaultWallet;
      const solBalance = await connection.getBalance(solVaultWallet);
      const balanceInSOL = solBalance / 1_000_000_000; // Convert lamports to SOL

      // Get liquidity threshold
      const thresholdInLamports =
        typeof tokenVaultAccount.liquidityThreshold === "function"
          ? tokenVaultAccount.liquidityThreshold.toNumber()
          : Number(tokenVaultAccount.liquidityThreshold);
      const thresholdInSOL = thresholdInLamports / 1_000_000_000; // Convert to SOL

      // Calculate progress percentage
      const progressPercentage = Math.min(
        Math.round((balanceInSOL / thresholdInSOL) * 100),
        100
      );

      return NextResponse.json({
        balanceInSOL,
        thresholdInSOL,
        progressPercentage,
        isReadyForLiquidity: balanceInSOL >= thresholdInSOL,
        remainingSOL: Math.max(0, thresholdInSOL - balanceInSOL),
        // Include raw data for debugging
        debug: {
          tokenVaultPDA: tokenVaultPDA.toString(),
          solVaultWallet: solVaultWallet.toString(),
          balanceInLamports: solBalance,
          thresholdInLamports,
        },
      });
    } catch (error) {
      console.error("[API] Error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch token vault data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] General error:", error);

    if (error instanceof Error) {
      console.error("[API] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch token vault data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
