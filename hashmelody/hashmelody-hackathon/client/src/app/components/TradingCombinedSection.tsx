import React from "react";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
// import { MIN_PRICE_IN_SOL, MIN_PRICE_IN_LAMPORTS } from '@/lib/constants';

interface TradingCombinedSectionProps {
  tokenPrice: number | null;
  priceChange: number;
  timeframe: string;
  tradingData: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  // NEW FIELDS
  marketCap: number;
  trades1h: number;
  volume24h: number;
  // END NEW FIELDS

  tokenAmount: string;
  handleTokenAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBuyTokens: () => Promise<void>;
  buyingTokens: boolean;
  authenticated: boolean;
  solanaWallet: string;
}

const TradingCombinedSection: React.FC<TradingCombinedSectionProps> = ({
  tokenPrice,
  priceChange,
  tradingData,
  marketCap,
  trades1h,
  volume24h,
  tokenAmount,
  handleTokenAmountChange,
  onBuyTokens,
  buyingTokens,
  authenticated,
  solanaWallet,
}) => {
  // Format price utility
  const formatPrice = (price: number | null) => {
    if (price === null) return "—";

    // Convert from lamports to SOL - price is already in lamports
    // No need to apply minimum price logic as the contract handles this
    const priceInSol = price / 1_000_000_000;
    return priceInSol.toFixed(6);
  };

  // Calculate estimated total based on current price
  const calculateEstimatedTotal = () => {
    console.log("Calculating estimated total with token price:", tokenPrice);
    if (tokenPrice === null || !tokenAmount) return "0.000000";

    const amount = parseFloat(tokenAmount);
    if (isNaN(amount)) return "0.000000";

    // Use the token price directly as provided, it's already in lamports
    const priceInLamports = tokenPrice;

    console.log("Using price in lamports:", priceInLamports);

    // Convert price from lamports to SOL for calculation
    const priceInSol = priceInLamports / 1_000_000_000;
    console.log("Price in SOL:", priceInSol);

    const total = priceInSol * amount;
    console.log(
      `Calculation: ${priceInSol} SOL × ${amount} tokens = ${total} SOL`
    );

    return total.toFixed(6);
  };

  return (
    <div className="bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6 p-6">
        {/* Price Overview Section */}
        <div className="bg-zinc-800 rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-200 mb-2 flex items-center">
                Current Price
                {tokenPrice === null && (
                  <span className="ml-2 text-zinc-400 text-sm">Loading...</span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">
                  {formatPrice(tokenPrice)} SOL
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    priceChange >= 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {priceChange >= 0 ? (
                    <ArrowUp size={12} className="inline mr-1" />
                  ) : (
                    <ArrowDown size={12} className="inline mr-1" />
                  )}
                  {Math.abs(priceChange).toFixed(2)}%
                </span>
              </div>
            </div>
            <TrendingUp size={32} className="text-emerald-500 opacity-50" />
          </div>

          {/* Price Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">Open</span>
              <span className="text-white font-medium">
                {tradingData.open.toFixed(6)}
              </span>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">High</span>
              <span className="text-white font-medium">
                {tradingData.high.toFixed(6)}
              </span>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">Low</span>
              <span className="text-white font-medium">
                {tradingData.low.toFixed(6)}
              </span>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">Close</span>
              <span className="text-white font-medium">
                {tradingData.close.toFixed(6)}
              </span>
            </div>
          </div>

          {/* NEW ROW: Market Cap, Trades (1h), Volume (24h) */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">
                Market Cap
              </span>
              <span className="text-white font-medium">
                {marketCap.toLocaleString()} SOL
              </span>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">
                Trades (1h)
              </span>
              <span className="text-white font-medium">
                {trades1h.toLocaleString()}
              </span>
            </div>
            <div className="bg-zinc-900 p-3 rounded-lg">
              <span className="text-zinc-400 text-xs block mb-1">
                Volume (24h)
              </span>
              <span className="text-white font-medium">
                {volume24h.toLocaleString()} SOL
              </span>
            </div>
          </div>
        </div>

        {/* Buy Section */}
        <div className="bg-zinc-800 rounded-lg p-5">
          <h2 className="text-xl font-semibold text-zinc-200 mb-4">
            Buy Tokens
          </h2>
          <div className="mb-4">
            <label className="block text-zinc-400 text-xs mb-2">
              Amount to Buy
            </label>
            <div className="flex">
              <input
                type="number"
                value={tokenAmount}
                onChange={handleTokenAmountChange}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-zinc-400 text-xs mb-2">
              Estimated Total
            </label>
            <div className="bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2">
              <span className="text-white">
                {calculateEstimatedTotal()} SOL
              </span>
            </div>
          </div>

          <button
            onClick={onBuyTokens}
            disabled={
              !authenticated ||
              !solanaWallet ||
              buyingTokens ||
              tokenPrice === null
            }
            className={`w-full py-3 rounded-md transition-colors ${
              !authenticated ||
              !solanaWallet ||
              buyingTokens ||
              tokenPrice === null
                ? "bg-zinc-600 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 text-black"
            }`}
          >
            {!authenticated
              ? "Connect Wallet"
              : !solanaWallet
              ? "Connect Solana Wallet"
              : tokenPrice === null
              ? "Loading Price..."
              : buyingTokens
              ? "Processing..."
              : "Buy Tokens"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingCombinedSection;
