// lib/contexts/TokenPriceContext.tsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
// import { MIN_PRICE_IN_SOL, MIN_PRICE_IN_LAMPORTS } from '@/lib/constants';

// Define the shape of our context data
interface TokenPriceContextType {
  price: number | null;
  priceInLamports: number | null;
  viewCount: number | null;
  timestamp: number | null;
  supply: string | null;
  supplyAsNumber: number | null;
  loading: boolean;
  error: string | null;
  refreshPrice: () => Promise<void>;
  lastRefreshed: Date | null;
}

// Create the context with a default value
const TokenPriceContext = createContext<TokenPriceContextType>({
  price: null,
  priceInLamports: null,
  viewCount: null,
  timestamp: null,
  supply: null,
  supplyAsNumber: null,
  loading: false,
  error: null,
  refreshPrice: async () => {},
  lastRefreshed: null,
});

interface TokenPriceProviderProps {
  mintAddress: string | null | undefined;
  children: React.ReactNode;
  refreshInterval?: number; // in milliseconds, default to 1 minute
}

export const TokenPriceProvider: React.FC<TokenPriceProviderProps> = ({
  mintAddress,
  children,
  refreshInterval = 60000, // Default 1 minute
}) => {
  // State for the price data
  const [price, setPrice] = useState<number | null>(null);
  const [priceInLamports, setPriceInLamports] = useState<number | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [supply, setSupply] = useState<string | null>(null);
  const [supplyAsNumber, setSupplyAsNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Fetch price function
  // Fetch price function
  const fetchPrice = useCallback(async () => {
    // Skip if no mint address
    if (!mintAddress) {
      setError("No mint address provided");
      return;
    }

    try {
      console.log(
        `[TokenPriceContext] Fetching price for mint: ${mintAddress}`
      );
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/token-price/${mintAddress}`);

      // Parse the response JSON whether it's an error or success
      const data = await response.json();

      // Check if the response contains an error
      if (!response.ok || data.error) {
        const errorMessage = data.error || `API error: ${response.status}`;
        console.error(
          `[TokenPriceContext] API returned error: ${errorMessage}`
        );
        throw new Error(errorMessage);
      }
      console.log("[TokenPriceContext] Fetched price data:", data);

      // Update all price-related state
      // Use the price directly as calculated by the API, without enforcing a minimum
      const finalPriceInLamports = data.priceInLamports;
      const finalPrice = finalPriceInLamports / 1_000_000_000;

      console.log(
        "[TokenPriceContext] Original price:",
        data.price,
        "Final price:",
        finalPrice
      );
      console.log(
        "[TokenPriceContext] Original price in lamports:",
        data.priceInLamports,
        "Final price in lamports:",
        finalPriceInLamports
      );

      setPrice(finalPrice);
      setPriceInLamports(finalPriceInLamports);
      setViewCount(data.viewCount);
      setTimestamp(data.timestamp);
      setSupply(data.supply);
      setSupplyAsNumber(data.supplyAsNumber);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("[TokenPriceContext] Error fetching token price:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch token price"
      );
    } finally {
      setLoading(false);
    }
  }, [mintAddress]);

  // Fetch price on mount and when mint address changes
  useEffect(() => {
    if (mintAddress) {
      fetchPrice();
    }
  }, [mintAddress, fetchPrice]);

  // Set up periodic refresh
  useEffect(() => {
    if (!mintAddress) return;

    const intervalId = setInterval(() => {
      fetchPrice();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [mintAddress, fetchPrice, refreshInterval]);

  // Provide the context value
  const contextValue: TokenPriceContextType = {
    price,
    priceInLamports,
    viewCount,
    timestamp,
    supply,
    supplyAsNumber,
    loading,
    error,
    refreshPrice: fetchPrice,
    lastRefreshed,
  };

  return (
    <TokenPriceContext.Provider value={contextValue}>
      {children}
    </TokenPriceContext.Provider>
  );
};

// Custom hook to use the token price context
export const useTokenPrice = () => useContext(TokenPriceContext);
