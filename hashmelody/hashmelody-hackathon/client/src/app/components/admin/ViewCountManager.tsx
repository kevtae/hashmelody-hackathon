// app/components/admin/ViewCountManager.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAnchorProgram } from '@/lib/hooks/useAnchorProgram';
import { getOracleViewCount } from '@/lib/services/token/updateOracle';
import { PublicKey } from '@solana/web3.js';

interface ViewCountManagerProps {
  uploadId: number;
  mintAddress: string | null;
  currentViewCount?: number;
  onUpdate?: (newCount: number) => void;
}

const ViewCountManager: React.FC<ViewCountManagerProps> = ({ 
  uploadId, 
  mintAddress, 
  currentViewCount = 0,
  onUpdate 
}) => {
  const [viewCount, setViewCount] = useState<number>(currentViewCount);
  const [loading, setLoading] = useState<boolean>(false);
  const [onChainViewCount, setOnChainViewCount] = useState<number | null>(null);
  const [updateOnChain, setUpdateOnChain] = useState<boolean>(true);
  const program = useAnchorProgram();

  // Fetch on-chain view count when component mounts
  useEffect(() => {
    const fetchOnChainCount = async () => {
      if (program && mintAddress) {
        try {
          const count = await getOracleViewCount(program, new PublicKey(mintAddress));
          setOnChainViewCount(count);
        } catch (error) {
          console.error('Error fetching on-chain view count:', error);
        }
      }
    };

    fetchOnChainCount();
  }, [program, mintAddress]);

  const handleUpdateViewCount = async () => {
    if (!uploadId || viewCount < 0) {
      toast.error('Please enter a valid view count');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/view-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadId,
          viewCount,
          updateOnChain,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('View count updated successfully!');
        if (onUpdate) onUpdate(viewCount);
        
        // Update on-chain count display if updated on-chain
        if (result.onChainUpdated) {
          setOnChainViewCount(viewCount);
        }
      } else {
        toast.error(`Failed to update view count: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating view count:', error);
      toast.error('An error occurred while updating view count');
    } finally {
      setLoading(false);
    }
  };

  if (!mintAddress) {
    return (
      <div className="p-4 bg-zinc-800 rounded-lg text-zinc-400 text-sm">
        Token mint address is required to manage view count
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-800 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-4">Manage View Count</h3>
      
      <div className="mb-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-zinc-400">Current View Count</label>
          <div className="flex items-center space-x-2">
            <span className="text-white">Database: {currentViewCount || 0}</span>
            <span className="text-zinc-500">|</span>
            <span className="text-white">
              On-chain: {onChainViewCount !== null ? onChainViewCount : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm text-zinc-400 mb-2">
          New View Count
        </label>
        <input
          type="number"
          value={viewCount}
          onChange={(e) => setViewCount(parseInt(e.target.value) || 0)}
          min="0"
          className="w-full bg-zinc-700 text-white px-3 py-2 rounded-md"
        />
      </div>
      
      <div className="mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={updateOnChain}
            onChange={(e) => setUpdateOnChain(e.target.checked)}
            className="form-checkbox h-4 w-4 text-blue-500"
          />
          <span className="text-sm text-zinc-400">
            Also update on-chain (requires authority signature)
          </span>
        </label>
      </div>
      
      <button
        onClick={handleUpdateViewCount}
        disabled={loading}
        className={`w-full px-4 py-2 rounded-md ${
          loading 
            ? 'bg-zinc-600 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {loading ? 'Updating...' : 'Update View Count'}
      </button>
      
      <div className="mt-4 text-xs text-zinc-500">
        <p>Note: Increasing view count will affect token price calculations.</p>
        <p>On-chain updates require platform authority signature.</p>
      </div>
    </div>
  );
};

export default ViewCountManager;