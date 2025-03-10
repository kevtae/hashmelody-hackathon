// tiktokService.ts
import axios from "axios";
import { TikTokVideo, TikTokApiResponse } from "./types";
import dotenv from "dotenv";

/**
 * Fetches TikTok videos by music_id
 * @param musicId The music ID to search for
 * @param timeframe "7d", "30d", or "90d" to determine date range
 * @param accessToken The TikTok API access token
 * @param maxCount Maximum number of videos to return (default: 20, max: 100)
 */

dotenv.config();

export async function fetchTikTokVideosByMusicId(
  musicId: string,
  timeframe: "7d" | "30d" | "90d",
  maxCount: number = 20
): Promise<TikTokVideo[]> {
  const accessToken = process.env.TIKTOK_ACCESS_TOKEN;

  // Calculate start and end dates based on timeframe
  const endDate = new Date();
  const startDate = new Date();

  if (timeframe === "7d") {
    startDate.setDate(endDate.getDate() - 7);
  } else if (timeframe === "30d") {
    startDate.setDate(endDate.getDate() - 30);
  } else if (timeframe === "90d") {
    startDate.setDate(endDate.getDate() - 90);
  }

  // Format dates as YYYYMMDD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  try {
    const response = await axios.post<TikTokApiResponse>(
      "https://open.tiktokapis.com/v2/research/video/query/",
      {
        query: {
          and: [
            {
              operation: "EQ",
              field_name: "music_id",
              field_values: [musicId],
            },
          ],
        },
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        max_count: maxCount,
        is_random: false,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Map the response to our expected TikTokVideo interface
    if (response.data && response.data.data && response.data.data.videos) {
      return response.data.data.videos.map((video: unknown) => {
        const v = video as Partial<TikTokVideo>; // Use Partial<> to allow optional fields
        return {
          id: v.id ?? v.video_id ?? "", // Ensure at least one is assigned
          video_id: v.video_id ?? "", // Explicitly map video_id
          username: v.username ?? "",
          video_description: v.video_description ?? "",
          view_count: v.view_count ?? 0,
          like_count: v.like_count ?? 0,
          comment_count: v.comment_count ?? 0,
          share_count: v.share_count ?? 0,
          create_time: v.create_time ?? 0,
        };
      });
    }

    return [];
  } catch (error) {
    console.error("Error fetching TikTok videos:", error);
    throw error;
  }
}
