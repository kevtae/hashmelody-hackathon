// app/components/shared/DisconnectButton.tsx
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export function DisconnectButton() {
  const { logout } = usePrivy();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleDisconnect = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Force page reload to clear any cached wallet state
      window.location.reload();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleDisconnect}
      disabled={isLoggingOut}
      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
    >
      {isLoggingOut ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner />
          <span className="ml-2">Disconnecting...</span>
        </span>
      ) : (
        "Disconnect Wallet"
      )}
    </button>
  );
}