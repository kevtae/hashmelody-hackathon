"use client";

import React from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { ConnectWallet } from "@/app/components/shared/ConnectWallet";
import { MurekaSongItem } from "@/lib/services/mureka/types";
import { ArrowRight, BarChart2, TrendingUp, ChevronRight } from "lucide-react";
// import { PublicKey } from "@solana/web3.js";

interface TradingChartSectionProps {
  musicData: MurekaSongItem;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tokenPrice: number | null; // Changed to allow null
  priceChange: number;
  timeframe: string;
  setTimeframeOption: (option: string) => void;
  tradingData: {
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    range: number;
  };
  tokenAmount: string;
  handleTokenAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBuyTokens: () => Promise<void>;
  buyingTokens: boolean;
  authenticated: boolean;
  solanaWallet: string;
  ready: boolean;
}

// Format SOL price with more precision
const formatPrice = (price: number | null) => {
  if (price === null) return "—";

  // Check if the price is already in SOL (small number)
  // or if it's in a smaller unit like lamports (large number)
  if (price < 0.1) {
    // Already in SOL or very small value
    return price.toFixed(6);
  } else {
    // Convert from lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const solPrice = price / 1_000_000_000;
    return solPrice.toFixed(6);
  }
};

const TradingChartSection: React.FC<TradingChartSectionProps> = ({
  musicData,
  activeTab,
  setActiveTab,
  tokenPrice,
  priceChange,
  timeframe,
  setTimeframeOption,
  tradingData,
  tokenAmount,
  handleTokenAmountChange,
  onBuyTokens,
  buyingTokens,
  solanaWallet,
  ready,
}) => {
  const { authenticated } = usePrivy();

  return (
    <div className="bg-zinc-900 rounded-xl shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          className={`px-6 py-4 font-medium text-sm ${
            activeTab === "buy"
              ? "text-white border-b-2 border-emerald-500"
              : "text-zinc-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("buy")}
        >
          Buy
        </button>
        <button
          className={`px-6 py-4 font-medium text-sm ${
            activeTab === "trade"
              ? "text-white border-b-2 border-emerald-500"
              : "text-zinc-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("trade")}
        >
          Trade
        </button>
      </div>

      {/* Token price and stats */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">
                {tokenPrice !== null ? formatPrice(tokenPrice) : "—"} SOL
              </h2>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  priceChange >= 0
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange}% ({timeframe})
              </span>
            </div>
            <div className="flex gap-6 mt-2 text-xs text-zinc-400">
              <div>
                <span>Open</span>
                <p className="text-white">{tradingData.open}</p>
              </div>
              <div>
                <span>High</span>
                <p className="text-white">{tradingData.high}</p>
              </div>
              <div>
                <span>Low</span>
                <p className="text-white">{tradingData.low}</p>
              </div>
              <div>
                <span>Close</span>
                <p className="text-white">{tradingData.close}</p>
              </div>
            </div>
          </div>
          <div>
            <select
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-1 text-sm"
              defaultValue="USD($)"
            >
              <option value="USD($)">USD($)</option>
              <option value="EUR(€)">EUR(€)</option>
              <option value="GBP(£)">GBP(£)</option>
            </select>
          </div>
        </div>

        {/* Chart timeframe options */}
        <div className="flex gap-2 mb-4">
          {["1m", "5m", "15m", "1h", "8h", "1d", "1w"].map((option) => (
            <button
              key={option}
              className={`px-3 py-1 text-xs rounded-md ${
                timeframe === option
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
              onClick={() => setTimeframeOption(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="relative bg-zinc-800 rounded-lg h-64 mb-6 overflow-hidden">
          <div className="h-full w-full flex items-center justify-center">
            <Image
              src="/api/placeholder/800/300"
              alt="Trading chart"
              width={800}
              height={300}
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart2 size={40} className="text-emerald-500 opacity-30" />
            </div>
          </div>
        </div>

        {/* Buy form (only if activeTab = "buy") */}
        {activeTab === "buy" && (
          <div className="bg-zinc-800 rounded-lg p-4">
            {!authenticated ? (
              // Show ConnectWallet if NOT authenticated
              <div className="flex flex-col items-center">
                <p className="text-zinc-400 text-sm mb-4">
                  Connect your wallet to buy MusiCoin.
                </p>
                <ConnectWallet />
              </div>
            ) : (
              // Show Buy Form if authenticated
              <>
                <div className="mb-4">
                  <label className="block text-zinc-400 text-xs mb-2">
                    Amount
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={tokenAmount}
                      onChange={handleTokenAmountChange}
                      className="bg-zinc-900 border border-zinc-700 rounded-l-md px-4 py-2 flex-1"
                    />
                    <div className="bg-zinc-700 px-4 py-2 rounded-r-md flex items-center">
                      <span>{musicData.ticker} Coin</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-zinc-400 text-xs mb-2">
                    Estimated Cost
                  </label>
                  <div className="bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 text-right">
                    <span>
                      {tokenPrice !== null && !isNaN(parseFloat(tokenAmount))
                        ? (tokenPrice * parseFloat(tokenAmount)).toFixed(6)
                        : "—"}{" "}
                      SOL
                    </span>
                  </div>
                </div>

                <button
                  className={`w-full font-medium rounded-md py-3 transition-colors ${
                    !authenticated || !solanaWallet || buyingTokens
                      ? "bg-zinc-600 cursor-not-allowed"
                      : "bg-emerald-500 hover:bg-emerald-600 text-black"
                  }`}
                  onClick={onBuyTokens}
                  disabled={!authenticated || !solanaWallet || buyingTokens}
                >
                  {!ready
                    ? "Loading..."
                    : !authenticated
                    ? "Connect Wallet to Buy"
                    : !solanaWallet
                    ? "Connect Solana Wallet"
                    : buyingTokens
                    ? "Processing..."
                    : "Buy MusiCoin"}
                </button>

                <div className="mt-4 text-center">
                  <a
                    href="#"
                    className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center justify-center gap-1"
                  >
                    More purchase methods <ArrowRight size={14} />
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {/* Markets section (only if activeTab = "trade") */}
        {activeTab === "trade" && (
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">MusiCoin Markets</h3>
              <div className="flex gap-2">
                <span className="bg-zinc-900 px-3 py-1 text-xs rounded-full">
                  Bot
                </span>
                <span className="text-zinc-400 text-xs flex items-center">
                  Earn
                </span>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-emerald-500" />
                <span>Spot Grid</span>
              </div>
              <ChevronRight size={16} className="text-zinc-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingChartSection;
