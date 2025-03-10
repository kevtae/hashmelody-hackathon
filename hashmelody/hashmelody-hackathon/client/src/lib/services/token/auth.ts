import { supabase } from "@/lib/services/supabase";

// Keep existing message creation and verification functions...

export class TokenAuthorizationStorage {
  /**
   * Stores a token authorization
   */
  static async storeAuthorization(
    requestId: string,
    signature: string,
    walletAddress: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from("token_authorizations").upsert(
        {
          request_id: requestId,
          signature,
          wallet_address: walletAddress,
          timestamp: Date.now(),
          used: false,
        },
        {
          onConflict: "request_id",
          ignoreDuplicates: true, // Ignore duplicates instead of updating
        }
      );

      if (error) {
        console.error("Error storing authorization:", error);
        throw error;
      }
    } catch (error) {
      console.error("Exception storing authorization:", error);
    }
  }
  // static async storeAuthorization(
  //   requestId: string,
  //   signature: string,
  //   walletAddress: string
  // ): Promise<void> {
  //   const { error } = await supabase
  //     .from('token_authorizations')
  //     .insert({
  //       request_id: requestId,
  //       signature,
  //       wallet_address: walletAddress,
  //       timestamp: Date.now(),
  //       used: false
  //     });

  //   if (error) {
  //     console.error("Error storing authorization:", error);
  //     throw error;
  //   }
  // }

  /**
   * Gets a token authorization
   */
  static async getAuthorization(requestId: string): Promise<{
    signature: string;
    walletAddress: string;
    timestamp: number;
    used: boolean;
  } | null> {
    // Use a transaction to get and lock the row
    const { data, error } = await supabase
      .from("token_authorizations")
      .select("*")
      .eq("request_id", requestId)
      .single();

    if (error) {
      console.error("Error fetching authorization:", error);
      return null;
    }

    if (!data) return null;

    return {
      signature: data.signature as string,
      walletAddress: data.wallet_address as string,
      timestamp: data.timestamp as number,
      used: data.used as boolean,
    };
  }

  /**
   * Marks a token authorization as used
   */
  static async markAsUsed(requestId: string): Promise<boolean> {
    // Use a transaction to update only if not already used
    const { error } = await supabase
      .from("token_authorizations")
      .update({ used: true })
      .eq("request_id", requestId)
      .eq("used", false); // Only update if not already used

    if (error) {
      console.error("Error marking authorization as used:", error);
      return false;
    }

    return true;
  }

  /**
   * Checks if a token authorization is used
   */
  static async isUsed(requestId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("token_authorizations")
      .select("used")
      .eq("request_id", requestId)
      .single();

    if (error || !data || typeof data.used !== "boolean") {
      return false;
    }

    return data.used;
  }
}
