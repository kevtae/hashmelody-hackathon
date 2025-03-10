import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
// import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import idl from "@/lib/idl/hashmelody.json";
import { getNetworkConfig } from "@/lib/config/network";
import type { Hashmelody } from "@/lib/idl/hashmelody";

interface OracleData {
  mint: PublicKey;
  viewCount: BN;
  lastUpdated: BN;
  bump: number;
  priceParams: {
    k: BN;
    m: BN;
  };
}

export async function GET(req: NextRequest) {
  try {
    console.log("token-price called");
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const mintAddress = segments[segments.length - 1];

    const networkConfig = getNetworkConfig();
    console.log(`Using network: ${process.env.SOLANA_NETWORK || "localnet"}`);
    console.log(`Network config: ${JSON.stringify(networkConfig, null, 2)}`);

    if (!mintAddress) {
      return NextResponse.json(
        { error: "Mint address is required" },
        { status: 400 }
      );
    }

    console.log(`API Fetching token price for mint: ${mintAddress}`);

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

    // Check if mint account exists and is actually a token mint
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

    // Derive oracle PDA
    const [oracle] = PublicKey.findProgramAddressSync(
      [Buffer.from("viewership_oracle"), mintPubkey.toBuffer()],
      programId
    );

    console.log(`[API] Oracle PDA: ${oracle.toString()}`);
    console.log(`[API] Mint: ${mintPubkey.toString()}`);

    // Check if oracle account exists
    const oracleInfo = await connection.getAccountInfo(oracle);
    console.log("[API] Oracle account exists:", !!oracleInfo);
    if (oracleInfo) {
      console.log("[API] Oracle account data length:", oracleInfo.data.length);
      console.log("[API] Oracle account owner:", oracleInfo.owner.toString());
    }

    if (!oracleInfo) {
      console.log(`[API] Oracle account doesn't exist: ${oracle.toString()}`);
      return NextResponse.json(
        { error: "Oracle account not found" },
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
      // Fetch oracle data first to validate
      console.log("[API] Fetching and validating oracle data");
      const oracleData = await program.account.viewershipOracle.fetch(oracle);

      console.log("[API] Oracle data validation:", {
        mint: oracleData.mint.toString(),
        viewCount: oracleData.viewCount.toString(),
        lastUpdated: oracleData.lastUpdated.toString(),
        bump: oracleData.bump,
        priceParams: {
          k: oracleData.priceParams.k.toString(),
          m: oracleData.priceParams.m.toString(),
        },
      });

      // Validate the mint in the oracle matches our mint
      if (!oracleData.mint.equals(mintPubkey)) {
        console.error("[API] Oracle's mint doesn't match the provided mint!");
        throw new Error("Oracle data validation failed: mint mismatch");
      }

      const priceData = await calculatePriceManually(
        connection,
        oracleData,
        mintPubkey
      );

      return NextResponse.json({
        price: priceData.priceInLamports / 1_000_000_000,
        priceInLamports: priceData.priceInLamports,
        viewCount: priceData.viewCount,
        timestamp: priceData.timestamp,
        supply: priceData.supplyStr,
        supplyAsNumber: priceData.supply,
        source: "manual_calculation",
      });
    } catch (error) {
      console.error("[API] Error:", error);
      return NextResponse.json(
        {
          error: "Failed to calculate token price",
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
        error: "Failed to fetch token price",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function calculatePriceManually(
  connection: Connection,
  oracleData: OracleData,
  mint: PublicKey
) {
  try {
    console.log(
      "[API] Starting manual price calculation based on contract logic"
    );

    // Fetch mint supply
    const mintInfo = await connection.getTokenSupply(mint);
    const currentSupply = new BN(mintInfo.value.amount);
    console.log(`[API] Current token supply: ${currentSupply.toString()}`);

    // Extract price parameters from oracle
    const k =
      typeof oracleData.priceParams.k === "function"
        ? oracleData.priceParams.k.toNumber()
        : Number(oracleData.priceParams.k);

    const m =
      typeof oracleData.priceParams.m === "function"
        ? oracleData.priceParams.m.toNumber()
        : Number(oracleData.priceParams.m);

    const viewCount =
      typeof oracleData.viewCount === "function"
        ? oracleData.viewCount.toNumber()
        : Number(oracleData.viewCount);

    console.log(
      `[API] Manual calculation raw parameters: k=${k}, m=${m}, viewCount=${viewCount}`
    );

    // Convert the parameters to match what's in the contract
    const kDecimal = k / 1_000_000_000_000.0; // k / 1e12
    const mDecimal = m / 1_000_000.0; // m / 1e6

    console.log(
      `[API] Converted parameters: kDecimal=${kDecimal}, mDecimal=${mDecimal}`
    );

    // Calculate price using the contract formula
    const supplyInMillions = currentSupply.toNumber() / 1_000_000_000_000.0; // Scale down by 1e12

    // Quadratic term: k * supply^2
    const quadraticTerm = kDecimal * supplyInMillions * supplyInMillions;
    console.log(`[API] Quadratic term: ${quadraticTerm}`);

    // Views term: m * (sqrt(viewCount) + base_component)
    const baseComponent = 10.0; // Same base component as in contract
    const viewSqrt = Math.sqrt(viewCount);
    const viewsTerm = mDecimal * (viewSqrt + baseComponent);

    console.log(`[API] Views term calculation:`);
    console.log(`[API] - View sqrt: ${viewSqrt}`);
    console.log(`[API] - Base component: ${baseComponent}`);
    console.log(
      `[API] - m * (sqrt(viewCount) + baseComponent): ${mDecimal} * (${viewSqrt} + ${baseComponent}) = ${viewsTerm}`
    );

    // Calculate final price - using the correct scaling factor to match the contract
    // The contract is scaling by 100,000,000,000 (1e11) instead of 100,000 (1e5)
    // This explains the 1,000,000x difference
    const priceBeforeScaling = quadraticTerm + viewsTerm;
    const calculatedPriceInLamports = Math.floor(priceBeforeScaling * 100_000); // Original calculation
    const adjustedPriceInLamports = calculatedPriceInLamports * 1_000_000; // Apply the 1,000,000x factor

    console.log(`[API] Price components:`);
    console.log(`[API] - Quadratic component: ${quadraticTerm}`);
    console.log(`[API] - Views component: ${viewsTerm}`);
    console.log(`[API] - Price before scaling: ${priceBeforeScaling}`);
    console.log(
      `[API] - Original calculated price (per formula): ${calculatedPriceInLamports} lamports`
    );
    console.log(
      `[API] - Adjusted price to match contract behavior: ${adjustedPriceInLamports} lamports`
    );
    console.log(
      `[API] - Final price in SOL: ${adjustedPriceInLamports / 1_000_000_000}`
    );

    return {
      priceInLamports: adjustedPriceInLamports, // Use the adjusted price that matches the contract
      viewCount,
      timestamp:
        typeof oracleData.lastUpdated === "function"
          ? oracleData.lastUpdated.toNumber()
          : Number(oracleData.lastUpdated) || Math.floor(Date.now() / 1000),
      supply: currentSupply.toNumber(),
      supplyStr: currentSupply.toString(),
    };
  } catch (error) {
    console.error("[API] Manual price calculation error:", error);
    throw error;
  }
}
