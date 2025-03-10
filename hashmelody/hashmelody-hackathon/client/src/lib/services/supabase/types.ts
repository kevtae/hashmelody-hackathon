export type UploadStatus =
  | "pending"
  | "generating"
  | "song_created"
  | "downloading_mp3"
  | "uploading_to_irys"
  | "uploaded_to_irys"
  | "sending_reply"
  | "failed"
  | "completed"
  | "creating_token"
  | "token_created"
  | "token_creation_failed";

export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface TokenInfo {
  mint: string;
  signature: string | string[];
  userSigned: boolean;
}

export interface AuthorizationInfo {
  requestId: string;
  hasAuth: boolean;
}

export interface TokenAuthorization {
  id: number;
  request_id: string;
  signature: string;
  wallet_address: string;
  timestamp: number;
  used: boolean;
  created_at?: string;
}

import { Database } from "@/lib/database.types"; // Adjust the path

export type UploadRow = Database["public"]["Tables"]["uploads"]["Row"];
