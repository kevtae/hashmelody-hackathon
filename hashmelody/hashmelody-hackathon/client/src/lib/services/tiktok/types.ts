export interface TikTokVideo {
  id: string;
  username: string;
  video_description: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  create_time: number;
  video_id?: string;
  cover_image_url?: string;
}

export interface TikTokError {
  code?: number;
  message?: string;
  details?: string;
}

export interface TikTokApiResponse {
  data: {
    videos: TikTokVideo[];
    cursor: number;
    has_more: boolean;
    search_id: string;
  };
  error?: TikTokError | null;
}
