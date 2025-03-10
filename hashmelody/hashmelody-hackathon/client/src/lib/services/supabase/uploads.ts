import { supabase } from "./client";
import type { TokenInfo, AuthorizationInfo } from "./types";
import type { MurekaSongItem } from "../mureka/types";
import type { IrysUploadResult } from "../irys/types";
import { Database } from "@/lib/database.types"; // Adjust the path

type UploadRow = Database["public"]["Tables"]["uploads"]["Row"];
type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];
// type UploadUpdate = Database["public"]["Tables"]["uploads"]["Update"];

export class UploadsService {
  /**
   * Insert initial prompt with ticker and return the new row's ID
   */
  public static async insertPrompt(prompt: string): Promise<number> {
    const { data, error } = await supabase
      .from("uploads")
      .insert<UploadInsert>({
        prompt,
        status: "pending",
        ticker: "",
        view_count: 0,
      })
      .select()
      .single();
    if (error) throw error;
    if (!data || typeof data.id !== "number")
      throw new Error("Invalid ID returned from insert");
    return data.id;
  }

  /**
   * Update a song's details after generation
   */
  public static async updateSong(uploadId: number, song: MurekaSongItem) {
    const { error } = await supabase
      .from("uploads")
      .update({
        title: song.title,
        song_id: song.song_id,
        cover: song.cover,
        mp3_url: song.mp3_url,
        genres: song.genres,
        moods: song.moods,
        duration_milliseconds: song.duration_milliseconds,
        share_link: song.share_link,
        status: "song created",
      })
      .eq("id", uploadId);

    if (error) throw error;
  }

  /**
   * Update a song's details after generation
   */
  public static async updateTicker(uploadId: number, ticker: string) {
    const { error } = await supabase
      .from("uploads")
      .update({
        ticker: ticker,
      })
      .eq("id", uploadId);

    if (error) throw error;
  }

  /**
   * Update upload status
   */
  public static async updateStatus(
    uploadId: number,
    status: UploadRow["status"]
  ) {
    const { error } = await supabase
      .from("uploads")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", uploadId);

    if (error) throw error;
  }

  /**
   * Fetch all uploads for the current user
   */
  public static async fetchUserUploads(): Promise<UploadRow[]> {
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as UploadRow[]; // Explicit type assertion
  }

  /**
   * Fetch a single upload by ID
   */
  public static async fetchUploadById(id: number): Promise<UploadRow | null> {
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("id", id)
      .single<UploadRow>(); // Add generic type parameter here

    if (error) throw error;
    return data;
  }

  // In your UploadsService class
  public static async getStatus(uploadId: number): Promise<string> {
    const { data, error } = await supabase
      .from("uploads")
      .select("status")
      .eq("id", uploadId)
      .single<{ status: string }>(); // Explicit type for single field selection

    if (error || !data) {
      console.error("Error fetching status:", error);
      return "failed";
    }

    return data.status;
  }

  /**
   * Updates the database with token authorization information
   */
  static async updateAuthorizationInfo(
    uploadId: number,
    authInfo: AuthorizationInfo
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("uploads")
        .update({
          request_id: authInfo.requestId,
          has_token_auth: authInfo.hasAuth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", uploadId);

      if (error) {
        throw error;
      }

      console.log(`Authorization info updated for upload ID ${uploadId}`);
    } catch (error) {
      console.error(
        `Error updating authorization info for upload ID ${uploadId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Updates the database with token information after token creation
   */
  static async updateTokenInfo(
    uploadId: number,
    tokenInfo: TokenInfo
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from("uploads")
        .update({
          token_mint: tokenInfo.mint,
          token_signature: tokenInfo.signature,
          user_signed: tokenInfo.userSigned || false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", uploadId);

      if (error) {
        throw error;
      }

      console.log(`Token info updated for upload ID ${uploadId}`);
    } catch (error) {
      console.error(
        `Error updating token info for upload ID ${uploadId}:`,
        error
      );
      throw error;
    }
  }

  public static async updateIrysInfo(
    uploadId: number,
    irysResult: IrysUploadResult
  ) {
    const { error } = await supabase
      .from("uploads")
      .update({
        irys_transaction_id: irysResult.transactionId,
        irys_url: irysResult.gatewayUrl,
        status: "uploaded_to_irys",
        updated_at: new Date().toISOString(),
      })
      .eq("id", uploadId);

    if (error) throw error;
  }
}
