"use client";

import React from "react";
import { useTokenVault } from "@/lib/hooks/useTokenVault";

interface TokenVaultProgressProps {
  mintAddress: string;
  refreshInterval?: number; // milliseconds
}

const TokenVaultProgress: React.FC<TokenVaultProgressProps> = ({
  mintAddress,
  refreshInterval = 300000, // Default to 5 minutes
}) => {
  const { data, loading, error } = useTokenVault(
    mintAddress,
    refreshInterval
  );

  return (
    <div className="bg-zinc-800 p-6 rounded-lg mb-6">
      <h3 className="text-lg font-medium text-white mb-2">
        Token-Specific Liquidity Pool Progress
      </h3>

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <div className="w-5 h-5 border-t-2 border-blue-500 rounded-full animate-spin"></div>
          <span className="ml-2 text-zinc-400">Loading vault data...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 py-2">{error}</div>
      ) : data ? (
        <>
          <div className="flex justify-between mb-1">
            <span className="text-zinc-400">
              Token Vault Balance:{" "}
              <span className="text-white font-medium">
                {data.balanceInSOL.toFixed(2)} SOL
              </span>
            </span>
            <span className="text-zinc-400">
              Raydium Threshold:{" "}
              <span className="text-white font-medium">
                {data.thresholdInSOL.toFixed(2)} SOL
              </span>
            </span>
          </div>
          <div className="text-xs text-zinc-500 mb-2">
            SOL collected from purchases of this specific token
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-700 rounded-full h-4 mb-3">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500 ease-in-out"
              style={{ width: `${data.progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">
              {data.progressPercentage}% complete
            </span>

            {data.isReadyForLiquidity ? (
              <span className="text-sm text-green-400 bg-green-900/30 px-2 py-1 rounded">
                Ready for Raydium liquidity!
              </span>
            ) : (
              <span className="text-sm text-zinc-400">
                {data.remainingSOL.toFixed(2)} SOL remaining
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-zinc-400 py-2">No vault data available</div>
      )}
    </div>
  );
};

export default TokenVaultProgress;