"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Video } from "lucide-react";
import { MurekaSongItem } from "@/lib/services/mureka/types";
import mockTikTokVideos from "./mocktiktok";
import { useAnchorProgram } from "@/lib/hooks/useAnchorProgram";
import { PublicKey } from "@solana/web3.js";
import { getOracleViewCount } from "@/lib/services/token/updateOracle";

type TikTokVideo = {
  id: string;
  username: string;
  video_description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  create_time: number;
  cover_image_url: string;
};

interface MusicInfoCardProps {
  musicData: MurekaSongItem;
  tokenPrice?: number;
  priceChange?: number;
  onGenerateAnother: () => void;
  // uploadId: string;
}

const MusicInfoCard: React.FC<MusicInfoCardProps> = ({
  musicData,
  onGenerateAnother,
  // uploadId,
}) => {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalEngagements, setTotalEngagements] = useState(0);
  const [timeframe, setTimeframe] = useState("7d"); // 7d, 30d, 90d
  const program = useAnchorProgram();
  const [onChainViewCount, setOnChainViewCount] = useState<number | null>(null);

  // Parse genres and moods in case they're JSON strings
  const parsedGenres = Array.isArray(musicData.genres)
    ? musicData.genres
    : typeof musicData.genres === "string"
    ? JSON.parse(musicData.genres)
    : [];

  const parsedMoods = Array.isArray(musicData.moods)
    ? musicData.moods
    : typeof musicData.moods === "string"
    ? JSON.parse(musicData.moods)
    : [];

  // Fetch on-chain view count
  useEffect(() => {
    const fetchOnChainCount = async () => {
      if (program && musicData.token_mint) {
        try {
          const count = await getOracleViewCount(
            program,
            new PublicKey(musicData.token_mint)
          );
          setOnChainViewCount(count);
          // Update total views to use on-chain value if available
          if (count !== null) {
            setTotalViews(count);
          }
        } catch (error) {
          console.error("Error fetching on-chain view count:", error);
        }
      }
    };

    fetchOnChainCount();
  }, [program, musicData.token_mint]);

  useEffect(() => {
    setLoading(true);

    // if (process.env.NODE_ENV === "development") {
    // Cast mock data to TikTokVideo[] to ensure type compatibility
    const fetchedVideos = mockTikTokVideos as TikTokVideo[];
    fetchedVideos.sort((a, b) => b.view_count - a.view_count);
    setVideos(fetchedVideos);

    // For total views, prioritize the on-chain view count if available
    let views = 0;
    let engagements = 0;
    fetchedVideos.forEach((video) => {
      views += video.view_count;
      engagements += video.like_count + video.comment_count + video.share_count;
    });

    // Only set total views if on-chain count is not available
    if (onChainViewCount === null) {
      setTotalViews(views);
    }

    setTotalEngagements(engagements);
    setLoading(false);
    // } else {
    //   fetch(
    //     `/api/tiktok?musicId=${musicData.tiktokMusicId}&timeframe=${timeframe}`
    //   )
    //     .then((r) => r.json())
    //     .then((json) => {
    //       const fetchedVideos = json.data || [];
    //       fetchedVideos.sort(
    //         (a: TikTokVideo, b: TikTokVideo) => b.view_count - a.view_count
    //       );
    //       setVideos(fetchedVideos);

    //       // Calculate totals
    //       let engagements = 0;
    //       fetchedVideos.forEach((video: TikTokVideo) => {
    //         engagements +=
    //           video.like_count + video.comment_count + video.share_count;
    //       });

    //       // Use database/on-chain view count instead of summing TikTok views
    //       setTotalEngagements(engagements);
    //     })
    //     .catch(console.error)
    //     .finally(() => setLoading(false));
    // }
  }, [timeframe, musicData, onChainViewCount]);

  // Update view count to use the one from musicData if available
  useEffect(() => {
    if (musicData.view_count) {
      setTotalViews(musicData.view_count);
    }
  }, [musicData.view_count]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-zinc-900 rounded-xl shadow-lg">
      {/* Top section with image, title and token info */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold mb-4 truncate">
          {musicData.title || "Your Generated Music"}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {musicData.cover && (
              <div className="mb-4">
                <Image
                  src={musicData.cover}
                  alt="Album cover"
                  width={500}
                  height={500}
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between">
            {/* Genres and Moods */}
            <div className="mb-4">
              {/* Genres */}
              {!!parsedGenres.length && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold mb-2 text-zinc-400">
                    Genres
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {parsedGenres.map((genre: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-zinc-800 rounded-full text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Moods */}
              {!!parsedMoods.length && (
                <div>
                  <h2 className="text-sm font-semibold mb-2 text-zinc-400">
                    Moods
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {parsedMoods.map((mood: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-zinc-800 rounded-full text-xs"
                      >
                        {mood}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Virality Stats */}
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-zinc-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Views</p>
            <p className="text-2xl font-bold text-white">
              {loading ? "..." : formatNumber(totalViews)}
            </p>
            {onChainViewCount !== null && (
              <p className="text-xs text-gray-400 mt-1">
                On-chain: {formatNumber(onChainViewCount)}
              </p>
            )}
          </div>
          <div className="bg-zinc-800 p-4 rounded-lg">
            <p className="text-gray-400 text-sm mb-1">Total Engagement</p>
            <p className="text-2xl font-bold text-white">
              {loading ? "..." : formatNumber(totalEngagements)}
            </p>
          </div>
        </div>
      </div>

      {/* TikTok Virality Section */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-l font-bold text-white flex items-center">
            <Video className="mr-2" size={20} />
            TikTok Virality
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe("7d")}
              className={`px-3 py-1 rounded-full text-sm ${
                timeframe === "7d"
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-700 text-gray-300"
              }`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeframe("30d")}
              className={`px-3 py-1 rounded-full text-sm ${
                timeframe === "30d"
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-700 text-gray-300"
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeframe("90d")}
              className={`px-3 py-1 rounded-full text-sm ${
                timeframe === "90d"
                  ? "bg-emerald-500 text-white"
                  : "bg-zinc-700 text-gray-300"
              }`}
            >
              90D
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {/* TikTok Videos List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 mb-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-zinc-800 p-3 rounded-lg flex items-center"
                >
                  <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center mr-3">
                    {video.cover_image_url ? (
                      <Image
                        src={video.cover_image_url}
                        alt={`Cover image for ${video.video_description}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Video size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">@{video.username}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {video.video_description}
                    </p>
                    <div className="flex space-x-3 mt-1 text-xs text-gray-400">
                      <span>{formatNumber(video.view_count)} views</span>
                      <span>{formatNumber(video.like_count)} likes</span>
                      <span>{formatDate(video.create_time)}</span>
                    </div>
                  </div>
                  <a
                    href={`https://www.tiktok.com/@${video.username}/video/${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 px-3 py-1 bg-zinc-700 rounded-full text-xs hover:bg-blue-500 transition-colors"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center justify-center"
                onClick={() =>
                  window.open("https://www.tiktok.com/upload", "_blank")
                }
              >
                <Video size={16} className="mr-2" />
                Share Track on TikTok
              </button>
              <button
                onClick={onGenerateAnother}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors text-sm"
              >
                Generate Another Track
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MusicInfoCard;
