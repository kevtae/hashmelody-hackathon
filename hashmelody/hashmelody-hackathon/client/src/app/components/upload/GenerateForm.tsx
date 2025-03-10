import React, { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSolanaWallets,
  // @ts-expect-error: : some ts error with WalletWithSignMessageMethod
  WalletWithSignMessageMethod,
} from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
import { ConnectWallet } from "@/app/components/shared/ConnectWallet";
import { DisconnectButton } from "@/app/components/shared/DisconnectButton";
import bs58 from "bs58"; // Add this import at the top

// Create a token authorization message function
function createTokenAuthorizationMessage(
  requestId: string,
  walletAddress: string
): string {
  return `I authorize HashMelody to create a music token on my behalf for request ID: ${requestId}.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
}

export function GenerateForm() {
  const { user, ready, authenticated } = usePrivy();
  const { wallets: solanaWallets, ready: solanaWalletsReady } =
    useSolanaWallets();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  // Get the first available Solana wallet
  const solanaWallet =
    solanaWallets.length > 0
      ? (solanaWallets[0] as WalletWithSignMessageMethod)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      console.log("Starting music generation process");

      setStatus("initializing");
      setError("");

      // Generate a unique request ID for this specific music generation
      const requestId = `music_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 15)}`;
      console.log("Generated new request ID:", requestId);

      let authSignature = null;

      if (solanaWallet) {
        try {
          setStatus("authorizing");
          console.log(
            "Requesting new signature authorization for wallet:",
            solanaWallet.address
          );

          // Create a unique message for this specific music generation
          const authMessage = createTokenAuthorizationMessage(
            requestId,
            solanaWallet.address
          );
          console.log("Authorization message:", authMessage);

          // Convert the message to Uint8Array
          const messageBytes = new TextEncoder().encode(authMessage);

          // Get a new signature for this specific request
          const signResult = await solanaWallet.signMessage(messageBytes);
          console.log("Raw sign result:", {
            result: signResult,
            type: typeof signResult,
            keys: signResult ? Object.keys(signResult) : [],
            isString: typeof signResult === "string",
            hasSignature: signResult?.signature !== undefined,
          });

          // Handle different possible signature formats
          let signature;
          if (typeof signResult === "string") {
            signature = signResult;
          } else if (signResult instanceof Uint8Array) {
            signature = bs58.encode(signResult);
          } else if (signResult.signature) {
            signature =
              typeof signResult.signature === "string"
                ? signResult.signature
                : bs58.encode(signResult.signature);
          } else {
            throw new Error("Unsupported signature format");
          }

          authSignature = signature;
          console.log("Processed signature:", {
            signature: authSignature.substring(0, 10) + "...",
            length: authSignature.length,
            type: typeof authSignature,
          });

          try {
            // Store this specific authorization
            const authResponse = await fetch("/api/auth/store", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requestId,
                signature: authSignature,
                walletAddress: solanaWallet.address,
                timestamp: Date.now(), // Add timestamp for better tracking
              }),
            });

            // Properly parse the response and handle potential empty responses
            let authData;
            const responseText = await authResponse.text();

            try {
              authData = JSON.parse(responseText);
            } catch (parseError) {
              console.log(parseError);
              console.error("Failed to parse auth response:", responseText);
              throw new Error(
                `Invalid authentication response format. Server returned: ${responseText.substring(
                  0,
                  100
                )}...`
              );
            }

            if (!authResponse.ok) {
              if (
                authData?.error?.includes?.("duplicate key value") ||
                authData?.error?.includes?.("already exists")
              ) {
                console.log("Authorization already exists, continuing...");
              } else {
                throw new Error(
                  authData?.error || "Failed to store authorization"
                );
              }
            } else {
              console.log("New authorization stored successfully:", {
                requestId,
                walletAddress: solanaWallet.address,
                timestamp: authData?.timestamp || Date.now(),
              });
            }
          } catch (error) {
            console.error("Auth storage issue:", error);
            setError(
              `Authentication error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
            setStatus("idle");
            return;
          }
        } catch (signError) {
          console.error("Error during message signing:", signError);
          setError(
            signError instanceof Error
              ? signError.message
              : "Wallet signature cancelled or failed"
          );
          setStatus("idle");
          return;
        }
      }

      // Proceed with generation
      setStatus("generating");
      setError("");

      // Submit the generation request with the pre-authorization
      console.log("Submitting request to API");
      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          userId: user?.id || "",
          walletAddress: solanaWallet?.address || "",
          chainType: "solana",
          requestId,
          authSignature,
        }),
      });
      console.log("response: ", response);

      const data = await response.json();

      console.log("data: ", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to start generation");
      }

      // Redirect to the music/[id] page to show status
      if (data.uploadId) {
        console.log(`Redirecting to /music/${data.uploadId}`);
        router.push(`/music/${data.uploadId}`);
      } else {
        throw new Error("No upload ID returned from server");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setStatus("error");
    }
  };

  if (!ready || !solanaWalletsReady) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <LoadingSpinner />
        <span className="ml-2">Loading wallet...</span>
      </div>
    );
  }

  // Function to render prompt input that is shared across all states
  const renderPromptInput = () => (
    <div className="mb-4">
      <label
        htmlFor="prompt"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Enter your prompt:
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 
                text-white placeholder-gray-400 focus:outline-none 
                focus:border-blue-500"
        placeholder="Describe the music you want to generate"
        rows={4}
        required
      />
    </div>
  );

  // Render the main form
  const renderForm = () => (
    <form onSubmit={handleSubmit} className="max-w-lg">
      {renderPromptInput()}

      <button
        type="submit"
        disabled={status !== "idle"}
        className={`w-full py-2 px-4 rounded-lg font-medium ${
          status === "idle"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-gray-600 text-gray-300 cursor-not-allowed"
        }`}
      >
        {status === "idle" && "Generate Music"}
        {status === "initializing" && "Initializing..."}
        {status === "authorizing" && "Authorizing..."}
        {status === "generating" && "Generating..."}
        {status === "error" && "Try Again"}
      </button>

      {error && <div className="mt-4 text-red-500 text-sm">Error: {error}</div>}

      {solanaWallet && (
        <div className="mt-4">
          <DisconnectButton />
        </div>
      )}
    </form>
  );

  return (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold mb-6">Generate Music</h2>

      {!authenticated ? (
        <div className="max-w-lg">
          {renderPromptInput()}
          <ConnectWallet />
          <div className="mt-4 text-sm text-gray-400">
            <p>
              Connect your Solana wallet to generate music and create an NFT.
            </p>
          </div>
        </div>
      ) : !solanaWallet ? (
        <div className="max-w-lg">
          {renderPromptInput()}
          <ConnectWallet />
          <div className="mt-4 text-sm text-gray-400">
            <p>Connect your Solana wallet to enable NFT creation.</p>
          </div>
        </div>
      ) : (
        renderForm()
      )}
    </div>
  );
}
