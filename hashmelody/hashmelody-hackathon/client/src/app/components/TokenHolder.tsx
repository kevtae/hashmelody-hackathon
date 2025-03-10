import React, { useState, useEffect } from "react";
import { Users, Share2 } from "lucide-react";

// Define an interface for token holder information
interface TokenHolder {
  address: string;
  balance: number;
  percentage: number;
}

interface TokenHoldersProps {
  tokenMint: string; // The mint address of the token
}

const TokenHolders: React.FC<TokenHoldersProps> = ({ tokenMint }) => {
  // State to manage token holders
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch token holders data
  useEffect(() => {
    const fetchTokenHolders = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call to fetch token holders
        // Mock implementation
        const mockHolders: TokenHolder[] = [
          {
            address: "7XqhH8nAQT3B5BHr5hZ99Qq5JNP8ZKf2v3Hdb2UqKUW",
            balance: 1212000,
            percentage: 35.5,
          },
          {
            address: "Dn8yNQVPzyKwNJHkKqohyKQRRmdRNZ3BBNVg1KmK7daz",
            balance: 752410,
            percentage: 26.7,
          },
          {
            address: "EfGDrqstAb7Lqz8Vd5vMH5tMarkxqTxVskvFqtqZ8RQD",
            balance: 498000,
            percentage: 17.9,
          },
          {
            address: "G5wKxF3kHdmNLy7TVi4qMzJNwQa6qSzETz1gGAPqqxcA",
            balance: 253120,
            percentage: 8.9,
          },
          {
            address: "HJd9zNqvWVpkETHicNMFPyLpwgXc6kzFAF3bhWjyVBGs",
            balance: 154210,
            percentage: 5.4,
          },
        ];

        setHolders(mockHolders);
        setIsLoading(false);
      } catch {
        setError("Failed to fetch token holders");
        setIsLoading(false);
      }
    };

    if (tokenMint) {
      fetchTokenHolders();
    }
  }, [tokenMint]);

  // Truncate wallet address for display
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 6
    )}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50 p-6 mt-6">
        <div className="flex items-center justify-center text-zinc-400 space-x-2">
          <Users size={20} className="animate-pulse" />
          <span>Loading token holders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50 p-6 mt-6">
        <div className="flex items-center justify-center text-red-500 space-x-2">
          <Share2 size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl shadow-2xl overflow-hidden border border-zinc-700/50 mt-6">
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/30">
        <h2 className="text-xl font-semibold text-zinc-200 mb-6 flex items-center gap-2">
          <Users size={20} className="text-emerald-400" />
          Top Token Holders
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-700/30">
                <th className="p-3 text-zinc-400 text-xs uppercase tracking-wider">
                  Rank
                </th>
                <th className="p-3 text-zinc-400 text-xs uppercase tracking-wider">
                  Address
                </th>
                <th className="p-3 text-zinc-400 text-xs uppercase tracking-wider text-right">
                  Balance
                </th>
                <th className="p-3 text-zinc-400 text-xs uppercase tracking-wider text-right">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {holders.map((holder, index) => (
                <tr
                  key={holder.address}
                  className="border-b border-zinc-700/30 last:border-b-0 hover:bg-zinc-700/30 transition-colors"
                >
                  <td className="p-3 text-white">{index + 1}</td>
                  <td className="p-3">
                    <a
                      href={`https://explorer.solana.com/address/${holder.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      {truncateAddress(holder.address)}
                    </a>
                  </td>
                  <td className="p-3 text-right text-white">
                    {holder.balance.toLocaleString()}
                  </td>
                  <td className="p-3 text-right text-white">
                    {holder.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TokenHolders;
