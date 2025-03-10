"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import LoadingScreen from "@/app/components/LoadingScreen";
import GenerationFailed from "@/app/components/GenerationFailed";
import { usePrivy } from "@privy-io/react-auth";
import { useSolanaWallets } from "@privy-io/react-auth";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { fetchMusicDataFromSupabase } from "@/lib/utils/fetch_music";
import type { Database } from "@/lib/database.types";
import ViewCountManager from "@/app/components/admin/ViewCountManager"; // Import the ViewCountManager
import { TokenPriceProvider } from "@/lib/contexts/TokenPriceContext";

// Import new vault progress component
import TokenVaultProgress from "@/app/components/TokenVaultProgress";

type MusicData = Database["public"]["Tables"]["uploads"]["Row"] | null;

// Import components
import MusicInfo from "@/app/components/music/MusicInfo";
import TradingArea from "@/app/components/music/TradingArea";
import MusicPlayer from "@/app/components/music/MusicPlayer";

export default function MusicTradingPage() {
  const router = useRouter();
  const params = useParams();
  const uploadParam = params.id;
  const uploadId =
    typeof uploadParam === "string" ? uploadParam : uploadParam?.[0] || "";

  // Privy/Solana states
  const { ready, authenticated, user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const solanaWallet = solanaWallets.length > 0 ? solanaWallets[0] : null;
  const program = useAnchorProgram();

  // Music states
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [musicData, setMusicData] = useState<MusicData>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);

  const getStatusMessage = () => {
    const statusMessages = {
      pending: "Preparing to generate music...",
      generating: "Generating your music...",
      song_created: "Music created! Processing audio...",
      downloading_mp3: "Downloading audio file...",
      uploading_to_irys: "Uploading to storage...",
      uploaded_to_irys: "Upload complete! Finalizing...",

      // Add token creation statuses
      creating_token: "Creating your music token...",
      token_created: "Music token created successfully!",
      token_creation_failed:
        "Token creation failed, but your music is available.",

      sending_reply: "Sending confirmation...",
      completed: "Music generation complete!",
      failed: "Sorry, generation failed.",
    };

    return status
      ? statusMessages[status] || "Processing your music..."
      : "Processing your music...";
  };

  // Check if user is admin
  useEffect(() => {
    if (!user) return;
    const adminEmails = ["admin@example.com", "dev@yourapp.com"];
    if (user.email && adminEmails.includes(user.email.address)) {
      setIsAdmin(true);
    }
  }, [user]);

  // For testing purposes, you can set isAdmin to true directly
  // Remove this in production
  useEffect(() => {
    setIsAdmin(true);
  }, []);

  // Fetch music data
  useEffect(() => {
    if (!uploadId) return;

    let isMounted = true;
    const loadMusicData = async () => {
      try {
        if (isMounted) setLoading(true);

        const completeData = await fetchMusicDataFromSupabase(
          parseInt(uploadId)
        );

        if (completeData && completeData.status === "completed") {
          if (isMounted) {
            setMusicData(completeData);
            //@ts-expect-error: IGNORE TYPE ERRORS
            setStatus("completed");
            setLoading(false);
          }
          return;
        }

        const response = await fetch(`/api/queue-status/${uploadId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch status: ${response.statusText}`);
        }

        const statusData = await response.json();

        if (isMounted) {
          setStatus(statusData.status);
          setProgress(statusData.progress || 0);
        }

        if (statusData.status === "completed") {
          try {
            const completeData = await fetchMusicDataFromSupabase(
              parseInt(uploadId)
            );
            if (isMounted) {
              setMusicData(completeData);
              setLoading(false);
            }
          } catch (dbError) {
            console.error("Error fetching complete data:", dbError);
            if (isMounted) {
              setError("Failed to load complete music data.");
              setLoading(false);
            }
          }
        } else if (statusData.status === "failed") {
          if (isMounted) setLoading(false);
        } else {
          setTimeout(() => {
            if (isMounted) loadMusicData();
          }, 2000);
        }
      } catch (err) {
        console.error("Error checking status:", err);
        if (isMounted) {
          setError("Failed to load music status.");
          setLoading(false);
        }
      }
    };

    loadMusicData();

    return () => {
      isMounted = false;
    };
  }, [uploadId]);

  // Handle view count updates
  const handleViewCountUpdate = (newCount: number) => {
    setMusicData((prevData) => {
      if (!prevData) return null;
      return { ...prevData, view_count: newCount };
    });
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <div className="flex-1 p-6 pb-20 pl-72">
        {loading ? (
          <LoadingScreen
            progress={progress}
            statusMessage={getStatusMessage()}
            status={status}
          />
        ) : status === "failed" ? (
          <GenerationFailed onRetry={() => router.push("/upload")} />
        ) : musicData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Music info */}
            <div className="lg:col-span-1">
              <MusicInfo
                musicData={musicData}
                onGenerateAnother={() => router.push("/upload")}
                uploadId={uploadId}
                status={status}
              />

              {/* Admin View Count Managers */}
              {isAdmin && musicData && musicData.token_mint && (
                <>
                  {/* Main ViewCountManager Component */}
                  <div className="mt-6">
                    <ViewCountManager
                      uploadId={parseInt(uploadId)}
                      mintAddress={musicData.token_mint}
                      currentViewCount={musicData.view_count || 0}
                      onUpdate={handleViewCountUpdate}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Trading interface */}
            <div className="lg:col-span-2">
              {musicData.token_mint ? (
                <TokenPriceProvider
                  mintAddress={musicData.token_mint}
                  refreshInterval={60000} // Every 1 minute
                >
                  {/* Add the TokenVaultProgress component */}
                  <TokenVaultProgress
                    mintAddress={musicData.token_mint}
                    refreshInterval={300000} // Every 5 minutes
                  />

                  <TradingArea
                    musicData={musicData}
                    authenticated={authenticated}
                    //@ts-expect-error: IGNORE TYPE ERRORS
                    solanaWallet={solanaWallet}
                    program={program}
                    ready={ready}
                  />
                </TokenPriceProvider>
              ) : (
                <div className="bg-zinc-800 p-6 rounded-lg">
                  <p className="text-red-400">
                    No token mint address found for this music.
                  </p>
                </div>
              )}

              {/* Display view count information - dynamically updated from ViewCountManager */}
              {musicData.token_mint && (
                <div className="mt-4 bg-zinc-800/50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">View count:</span>
                    <span className="text-white font-medium">
                      {musicData.view_count?.toLocaleString() || "0"} views
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // If no music data or error
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-400">{error || "No music data found"}</p>
            <button
              onClick={() => router.push("/upload")}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-full"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Player Bar */}
      {musicData && <MusicPlayer musicData={musicData} />}
    </div>
  );
}
