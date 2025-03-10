export interface MurekaApiResponse {
  feed_id: number;
  state: number;
  songs: MurekaSongItem[];
}

export interface MurekaSongItem {
  id?: number;
  created_at?: string;
  title?: string | null;
  mp3_url?: string | null;
  song_id?: string | null;
  cover?: string | null;
  version?: number | null;
  genres?: string | null;
  moods?: string | null;
  share_link?: string | null;
  status?: string | null;
  prompt?: string | null;
  duration_milliseconds?: string | null;
  generate_at?: string | null;
  updated_at?: string | null;
  irys_url?: string | null;
  irys_transaction_id?: string | null;
  token_mint?: string | null;
  token_signature?: string | null;
  request_id?: string | null;
  has_token_auth?: boolean | null;
  user_signed?: boolean | null;
  ticker?: string | null;
  gatewayUrl?: string | null;
  tiktokMusicId?: string | null;
  view_count?: number | null;
}
