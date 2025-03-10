export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      uploads: {
        Row: {
          // The data returned from .select()
          id: number;
          created_at: string; // Timestamp with time zone
          title: string | null;
          mp3_url: string | null;
          song_id: string | null;
          cover: string | null;
          version: number | null; // smallint type
          genres: string | null;
          moods: string | null;
          ticker: string | null;
          share_link: string | null;
          status: string | null; // Default is 'prompt'
          prompt: string | null;
          duration_milliseconds: string | null;
          generate_at: string | null;
          updated_at: string | null;
          irys_url: string | null;
          irys_transaction_id: string | null;
          token_mint: string | null;
          token_signature: string | null;
          request_id: string | null;
          has_token_auth: boolean | null; // Default is false
          user_signed: boolean | null; // Default is false
          view_count: number | null // New field for view count
        };
        Insert: {
          // The data expected for .insert()
          id?: never; // Generated identity column, must not be supplied
          created_at?: string; // Default is now()
          title?: string | null;
          mp3_url?: string | null;
          song_id?: string | null;
          cover?: string | null;
          version?: number | null;
          genres?: string | null;
          moods?: string | null;
          ticker: string | null;
          share_link?: string | null;
          status?: string | null; // Default is 'prompt'
          prompt?: string | null;
          duration_milliseconds?: string | null;
          generate_at?: string | null;
          updated_at?: string | null;
          irys_url?: string | null;
          irys_transaction_id?: string | null;
          token_mint?: string | null;
          token_signature?: string | null;
          request_id?: string | null;
          has_token_auth?: boolean | null; // Default is false
          user_signed?: boolean | null; // Default is false
          view_count: number | null // New field for view count
        };
        Update: {
          // The data expected for .update()
          id?: never; // Primary key cannot be updated
          created_at?: string; // Usually unchanged
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
          view_count: number | null // New field for view count
        };
      };
    };
  };
}
