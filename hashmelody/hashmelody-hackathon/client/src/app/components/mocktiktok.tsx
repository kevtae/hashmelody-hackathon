import { TikTokVideo } from "@/lib/services/tiktok/types";

const mockTikTokVideos: TikTokVideo[] = [
  {
    id: "7179049779358371098",
    username: "editzisfunbro",
    video_description: "enjoy phonk music",
    view_count: 25000,
    like_count: 1500,
    comment_count: 5600,
    share_count: 12300,
    create_time: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60, // 7 days ago
    cover_image_url: "https://picsum.photos/150", // Replace with actual image URL
  },
  {
    id: "7179049779358371098",
    username: "beatmaker22",
    video_description: "Awesome new beat! 🎵",
    view_count: 17500,
    like_count: 9800,
    comment_count: 3200,
    share_count: 8700,
    create_time: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, // 5 days ago
    cover_image_url: "https://picsum.photos/151", // Replace with actual image URL
  },
  {
    id: "7179049779358371098",
    username: "upandrising",
    video_description: "Dance challenge incoming",
    view_count: 32000,
    like_count: 2200,
    comment_count: 780,
    share_count: 15600,
    create_time: Math.floor(Date.now() / 1000) - 10 * 24 * 60 * 60, // 10 days ago
    cover_image_url: "https://picsum.photos/152", // Replace with actual image URL
  },
  {
    id: "7179049779358371098",
    username: "musicvibes",
    video_description: "This track is pure! 🚀",
    view_count: 12000,
    like_count: 750,
    comment_count: 2900,
    share_count: 6500,
    create_time: Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60, // 3 days ago
    cover_image_url: "https://picsum.photos/153", // Replace with actual image URL
  },
  {
    id: "7179049779358371098",
    username: "soundwave",
    video_description: "New sound, who dis? 🎧",
    view_count: 9800,
    like_count: 620,
    comment_count: 2100,
    share_count: 5200,
    create_time: Math.floor(Date.now() / 1000) - 6 * 24 * 60 * 60, // 6 days ago
    cover_image_url: "https://picsum.photos/154", // Replace with actual image URL
  },
];

export default mockTikTokVideos;
