import React from "react";
import { useTokenPrice } from "@/lib/contexts/TokenPriceContext";

// A simple component that displays token price using the context
interface SimplePriceDisplayProps {
  mintAddress: string;
}

const SimplePriceDisplay: React.FC<SimplePriceDisplayProps> = ({
  mintAddress,
}) => {
  // Use the token price context
  const {
    // price,
    priceInLamports,
    loading,
    error,
    refreshPrice,
    lastRefreshed,
  } = useTokenPrice();

  // Format the price
  const formatPrice = (priceValue: number | null): string => {
    if (priceValue === null) return "—";

    // Price is always in lamports from the API, so always convert to SOL
    const displayPrice = priceValue / 1_000_000_000;

    return displayPrice.toFixed(6);
  };

  return (
    <div className="p-4 bg-zinc-800 rounded-lg">
      <h3 className="font-bold text-lg mb-2">Token Price</h3>

      <div className="mb-2">
        <strong>Mint:</strong>{" "}
        {mintAddress ? `${mintAddress.substring(0, 8)}...` : "None"}
      </div>

      <div className="mb-2">
        <strong>Price:</strong>{" "}
        {loading ? "Loading..." : formatPrice(priceInLamports)} SOL
      </div>

      {lastRefreshed && (
        <div className="mb-2 text-xs text-zinc-400">
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="text-red-400 mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}

      <button
        onClick={refreshPrice}
        disabled={loading || !mintAddress}
        className="px-4 py-2 bg-emerald-500 text-black font-medium rounded hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </span>
        ) : (
          "Refresh Price"
        )}
      </button>
    </div>
  );
};

export default SimplePriceDisplay;
