// app/components/shared/ConnectWallet.tsx
import { usePrivy, useLogin } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { useState } from "react";

export function ConnectWallet() {
  const { ready, authenticated, connectWallet } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const [isConnecting, setIsConnecting] = useState(false);

  const { login } = useLogin({
    onComplete: () => console.log("Login complete!"),
  });

  // Debug all connected wallets
  console.log("All connected Solana wallets:", solanaWallets);

  // Find if a Solana wallet is connected
  const solanaWallet = solanaWallets.length > 0 ? solanaWallets[0] : null;

  if (!ready) {
    return (
      <div className="flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2 text-sm">Loading...</span>
      </div>
    );
  }

  // If not authenticated, show login button
  if (!authenticated) {
    return (
      <button
        onClick={() => {
          setIsConnecting(true);
          login({
            // @ts-expect-error: : cannot type this
            loginMethod: "wallet",
            walletConnectors: [
              { name: "phantom", config: { chain: "solana" } },
              "solflare",
              "backpack",
            ],
            chainOptions: {
              preferredChain: "solana",
              solanaChainName: "devnet",
            },
            // @ts-expect-error: : cannot type this
          }).finally(() => setIsConnecting(false));
        }}
        disabled={isConnecting}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <span className="flex items-center">
            <LoadingSpinner />
            <span className="ml-2">Connecting...</span>
          </span>
        ) : (
          "Connect Wallet"
        )}
      </button>
    );
  }

  // If authenticated but no Solana wallet connected
  if (!solanaWallet) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => {
            setIsConnecting(true);
            connectWallet({
              // @ts-expect-error: : cannot type this
              walletConnectors: [
                { name: "phantom", config: { chain: "solana" } },
                "solflare",
                "backpack",
              ],
              chainOptions: {
                preferredChain: "solana",
                solanaChainName: "devnet",
              },
              // @ts-expect-error: : cannot type this
            }).finally(() => setIsConnecting(false));
          }}
          disabled={isConnecting}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm font-medium transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <span className="flex items-center">
              <LoadingSpinner />
              <span className="ml-2">Connecting Solana...</span>
            </span>
          ) : (
            "Connect Solana Wallet"
          )}
        </button>
      </div>
    );
  }

  // If Solana wallet is connected, show address
  return (
    <div className="px-4 py-2 bg-gray-800 text-gray-200 rounded-full text-sm font-mono flex items-center">
      <span className="mr-2">🌞</span>
      {solanaWallet.address.slice(0, 6)}...{solanaWallet.address.slice(-4)}
    </div>
  );
}
