import { useState, useEffect, useCallback } from "react";

interface TokenVaultData {
  balanceInSOL: number;
  thresholdInSOL: number;
  progressPercentage: number;
  isReadyForLiquidity: boolean;
  remainingSOL: number;
  debug?: {
    tokenVaultPDA?: string;
    solVaultWallet?: string;
    balanceInLamports?: number;
    thresholdInLamports?: number;
    [key: string]: unknown;
  };
}

export function useTokenVault(mintAddress: string, refreshInterval = 60000) {
  const [data, setData] = useState<TokenVaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(
    null
  );

  const fetchVaultData = useCallback(async () => {
    if (!mintAddress) {
      setError("Mint address is required");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching token vault data for:", mintAddress);
      setLoading(true);
      setError(null);

      // Call the API endpoint - use the correct format that matches your token-price API
      const apiUrl = `/api/token-vault/${mintAddress}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl);
      const responseData = await response.json();

      console.log("API response:", responseData);

      if (!response.ok) {
        console.error("API error:", responseData);
        setDebugInfo(responseData);
        throw new Error(responseData.error || "Failed to fetch vault data");
      }

      setData(responseData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching vault data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load vault data. Please try again later."
      );
      setLoading(false);
    }
  }, [mintAddress]);

  useEffect(() => {
    if (mintAddress) {
      fetchVaultData();

      // Set up refresh interval
      const intervalId = setInterval(fetchVaultData, refreshInterval);

      return () => clearInterval(intervalId);
    }
  }, [mintAddress, refreshInterval, fetchVaultData]);

  return {
    data,
    loading,
    error,
    debugInfo,
    refetch: fetchVaultData,
  };
}
