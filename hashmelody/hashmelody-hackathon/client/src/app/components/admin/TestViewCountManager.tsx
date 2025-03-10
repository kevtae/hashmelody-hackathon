// components/admin/TestViewCountManager.tsx
import React, { useState } from "react";
import { PublicKey } from "@solana/web3.js";

interface TestViewCountManagerProps {
  uploadId: number;
  mintAddress: string;
  currentViewCount: number;
  onUpdate: (newCount: number) => void;
}


interface ViewCountResult {
  success: boolean;
  error?: string;
  onChainUpdated: boolean;
  data?: {
    onChainSignature?: string;
    // Add other possible response properties here
  };
}

export default function TestViewCountManager({
  uploadId,
  mintAddress,
  currentViewCount,
  onUpdate,
}: TestViewCountManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newCount, setNewCount] = useState(currentViewCount.toString());
  const [updateOnChain, setUpdateOnChain] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ViewCountResult | null>(null);

  // Validate the mint address
  const isValidMint = React.useMemo(() => {
    try {
      if (!mintAddress) return false;
      new PublicKey(mintAddress);
      return true;
    } catch {
      return false;
    }
  }, [mintAddress]);

  const handleUpdateViewCount = async () => {
    if (!uploadId || isNaN(parseInt(newCount)) || parseInt(newCount) < 0) {
      setError("Please enter a valid positive number");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      // Call your API endpoint to update the view count
      const response = await fetch("/api/view-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId,
          viewCount: parseInt(newCount),
          updateOnChain,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        if (onUpdate) onUpdate(parseInt(newCount));
      } else {
        setError(data.error || "Failed to update view count");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not valid mint address
  if (!isValidMint) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-400 mb-3">
        View Count Manager (Testing)
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={newCount}
            onChange={(e) => setNewCount(e.target.value)}
            className="bg-zinc-800 text-white px-3 py-1 rounded w-24"
            min="0"
          />
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="update-on-chain"
              checked={updateOnChain}
              onChange={(e) => setUpdateOnChain(e.target.checked)}
              className="bg-zinc-800"
            />
            <label htmlFor="update-on-chain" className="text-xs text-zinc-400">
              Update on-chain
            </label>
          </div>

          <button
            onClick={handleUpdateViewCount}
            disabled={isLoading}
            className={`text-xs px-3 py-1 rounded ${
              isLoading
                ? "bg-zinc-700 text-zinc-400"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>

        {error && <div className="text-xs text-red-400 mt-1">{error}</div>}

        {result && result.success && (
          <div className="text-xs text-green-400 mt-1">
            Update successful!
            {result.onChainUpdated ? " (Updated on-chain)" : " (Database only)"}
          </div>
        )}

        {result && !result.success && (
          <div className="text-xs text-red-400 mt-1">
            Update failed: {result.error || "Unknown error"}
          </div>
        )}

        {/* Display transaction signature if available */}
        {result && result.data && result.data.onChainSignature && (
          <div className="text-xs text-zinc-500 mt-1 break-all">
            Tx: {result.data.onChainSignature}
          </div>
        )}
      </div>
    </div>
  );
}
