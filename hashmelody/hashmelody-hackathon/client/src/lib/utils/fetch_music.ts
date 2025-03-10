import { UploadsService } from "@/lib/services/supabase/uploads";

export async function fetchMusicDataFromSupabase(uploadId: number) {
  try {
    console.log("Fetching music data directly from Supabase for uploadId:", uploadId);
    
    // Use the UploadsService to fetch the complete record
    const upload = await UploadsService.fetchUploadById(uploadId);
    
    if (!upload) {
      console.error("No upload found with ID:", uploadId);
      throw new Error("Music data not found");
    }
    
    console.log("Retrieved music data from Supabase:", upload);
    
    // Check if token_mint exists
    if (!upload.token_mint) {
      console.warn("No token_mint found in the upload data");
    } else {
      console.log("Found token_mint:", upload.token_mint);
    }
    
    return upload;
  } catch (error) {
    console.error("Error fetching music data from Supabase:", error);
    throw error;
  }
}