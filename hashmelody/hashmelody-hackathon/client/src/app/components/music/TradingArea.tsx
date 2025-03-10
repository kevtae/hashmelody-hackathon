// app/components/music/TradingArea.tsx
import React, { useState, useEffect } from "react";
import {
  buyToken,
  validateBuyInputs,
  // purchaseSingleToken,
} from "@/lib/services/token/buy";
import { PublicKey } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { Program } from "@coral-xyz/anchor";
import { MurekaSongItem } from "@/lib/services/mureka/types";
import type { Hashmelody } from "@/lib/idl/hashmelody";
import TradingCombinedSection from "../TradingCombinedSection";
import TokenHolder from "../TokenHolder";
import { useTokenPrice } from "@/lib/contexts/TokenPriceContext";

interface TradingAreaProps {
  musicData: MurekaSongItem;
  authenticated: boolean;
  solanaWallet: string;
  program: Program<Hashmelody> | null;
  ready: boolean;
}

// Default trading data structure
const defaultTradingData = {
  open: 0.000012,
  high: 0.000212,
  low: 0.0000087,
  close: 0.0,
  change: 0.0,
  range: 0,
};

const TradingArea: React.FC<TradingAreaProps> = ({
  musicData,
  authenticated,
  solanaWallet,
  program,
  // ready,
}) => {
  // Trading states
  const [tokenAmount, setTokenAmount] = useState("0.01");
  const timeframe = "5m";
  const [buyingTokens, setBuyingTokens] = useState(false);
  const [lastPurchaseSignature, setLastPurchaseSignature] = useState<
    string | null
  >(null);

  // Use the centralized token price context
  const {
    price,
    priceInLamports,
    // viewCount,
    refreshPrice,
    // loading: priceLoading,
    error: priceError,
  } = useTokenPrice();

  // Additional state for trading display
  const volume24h = 0;
  const priceChange = 0;
  const [tradingData, setTradingData] = useState(defaultTradingData);

  // Update tradingData when price changes
  useEffect(() => {
    if (price !== null) {
      setTradingData((prev) => ({
        ...prev,
        close: price,
        // We could update other fields if the API provided this data
      }));
    }
  }, [price]);

  const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setTokenAmount(value);
    }
  };

  // Handle buying tokens
  const handleBuyTokens = async () => {
    console.log("Buy token clicked - Starting purchase flow");

    // Check if program is initialized
    if (!program) {
      console.error("Program not initialized");
      toast.error("Unable to connect to the Solana program");
      return;
    }

    // Check if wallet is connected
    if (!solanaWallet) {
      console.error("Solana wallet not connected");
      toast.error("Please connect your Solana wallet first");
      return;
    }

    // Check if mint address exists
    if (!musicData?.token_mint) {
      console.error("No mint address found for this music");
      toast.error("Token information is missing");
      return;
    }

    // Parse and validate the amount
    let amount: number;
    try {
      amount = parseFloat(tokenAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount greater than 0");
        return;
      }

      // Warn if the user tries to buy more than 1.0 tokens
      if (amount > 1.0) {
        const confirmLargeAmount = window.confirm(
          "You're attempting to purchase a large amount of tokens which may require significant SOL. Do you want to continue?"
        );

        if (!confirmLargeAmount) {
          return;
        }
      }
    } catch {
      toast.error("Invalid amount format");
      return;
    }

    // Use the validation helper
    const validationError = validateBuyInputs(
      program,
      musicData.token_mint,
      amount
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setBuyingTokens(true);

      let mintPubkey: PublicKey;
      try {
        mintPubkey = new PublicKey(musicData.token_mint);
      } catch (error) {
        console.error("Error creating PublicKey:", error);
        toast.error("Invalid mint address format");
        setBuyingTokens(false);
        return;
      }

      const toastId = toast.loading("Processing purchase...");

      try {
        const signature = await buyToken(program, mintPubkey, amount);
        // const signature = await purchaseSingleToken(program, mintPubkey);

        console.log("Transaction successful:", signature);

        setLastPurchaseSignature(signature);

        toast.dismiss(toastId);
        toast.success("Successfully purchased tokens!");

        // Refresh price after successful purchase
        refreshPrice();
      } catch (error) {
        console.error("Transaction failed:", error);
        let errorMessage = "Failed to purchase tokens";

        // Extract more detailed error message if possible
        if (error instanceof Error) {
          errorMessage = error.message;

          // Check for specific error types
          if (error.message.includes("insufficient funds")) {
            errorMessage =
              "Insufficient funds to complete this purchase. The token costs approximately 10 SOL per token.";
          } else if (error.message.includes("Transaction simulation failed")) {
            errorMessage =
              "Transaction simulation failed. This may be due to insufficient funds or program constraints.";
          }
        }

        toast.dismiss(toastId);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.dismiss();
      toast.error("An unexpected error occurred");
    } finally {
      setBuyingTokens(false);
    }
  };

  // Add success UI for recent purchases
  useEffect(() => {
    if (lastPurchaseSignature) {
      // Reset the signature after showing success message for some time
      const timer = setTimeout(() => {
        setLastPurchaseSignature(null);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [lastPurchaseSignature]);

  return (
    <>
      {lastPurchaseSignature && (
        <div className="mb-4 p-4 bg-emerald-900/30 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-emerald-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 
                7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="font-medium text-emerald-400">
              Purchase Successful!
            </h3>
          </div>
          <p className="text-sm text-zinc-400 mb-2">
            Your token purchase was completed successfully. The tokens have been
            added to your wallet.
          </p>
          <div className="text-xs text-zinc-500">
            <span>Transaction: </span>
            <a
              href={`https://explorer.solana.com/tx/${lastPurchaseSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:text-emerald-400"
            >
              {lastPurchaseSignature.substring(0, 8)}...
              {lastPurchaseSignature.substring(
                lastPurchaseSignature.length - 8
              )}
            </a>
          </div>
        </div>
      )}

      {priceError && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 
                0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 
                0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 
                11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 
                0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-400 font-medium">Price Error</span>
          </div>
          <p className="mt-2 text-sm text-zinc-400">{priceError}</p>
          <button
            onClick={refreshPrice}
            className="mt-2 text-sm text-emerald-500 hover:text-emerald-400"
          >
            Retry fetching price
          </button>
        </div>
      )}

      <TradingCombinedSection
        tokenPrice={priceInLamports}
        priceChange={priceChange}
        marketCap={1}
        trades1h={27}
        volume24h={volume24h}
        tradingData={tradingData}
        tokenAmount={tokenAmount}
        timeframe={timeframe}
        handleTokenAmountChange={handleTokenAmountChange}
        onBuyTokens={handleBuyTokens}
        buyingTokens={buyingTokens}
        authenticated={authenticated}
        solanaWallet={solanaWallet}
      />

      {musicData?.token_mint && (
        <TokenHolder tokenMint={musicData.token_mint} />
      )}
    </>
  );
};

export default TradingArea;
