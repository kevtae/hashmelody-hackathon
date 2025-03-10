// app/api/queue-status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { UploadsService } from "@/lib/services/supabase";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Helper function to convert status to a progress percentage
function getProgressFromStatus(status: string): number {
  const progressMap: Record<string, number> = {
    pending: 10,
    generating: 20,
    song_created: 40,
    downloading_mp3: 60,
    uploading_to_irys: 75,
    uploaded_to_irys: 90,
    sending_reply: 95,
    completed: 100,
    failed: 0,
  };

  return progressMap[status] || 0;
}

export async function GET(req: NextRequest) {
  try {
    // Grab the ID directly from the URL
    const url = new URL(req.url);
    const segments = url.pathname.split("/");
    const idStr = segments[segments.length - 1];
    const id = parseInt(idStr, 10);

    // const id = parseInt(params.id);
    console.log("Queue Status API called for ID:", id);

    if (isNaN(id)) {
      console.error("Invalid ID format:", id);
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Try to get status from Redis queue first
    const queueKey = `music_generation_${id}`;
    const queueStatus = await redis.get<string>(queueKey);
    console.log(`Redis status for ${id}:`, queueStatus);

    // Get data from database as backup
    const dbUpload = await UploadsService.fetchUploadById(id);

    if (!dbUpload) {
      console.error("Upload not found for ID:", id);
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Get the DB status (account for different formats)
    const dbStatus = dbUpload.status ?? "unknown";

    console.log(`Database status for ${id}:`, dbStatus);

    // Use Redis status if available, otherwise use DB status
    const currentStatus = queueStatus || dbStatus;

    // Prepare response object
    // Update the response object creation
    const response = {
      status: currentStatus,
      queueStatus: queueStatus || null,
      dbStatus: dbStatus,
      progress: getProgressFromStatus(currentStatus),
      prompt: dbUpload.prompt,
      // Use correct song properties from UploadRow
      song: dbUpload.song_id
        ? {
            id: dbUpload.song_id,
            title: dbUpload.title,
            mp3_url: dbUpload.mp3_url,
            cover: dbUpload.cover,
            genres: dbUpload.genres,
            moods: dbUpload.moods,
            duration: dbUpload.duration_milliseconds,
            share_link: dbUpload.share_link,
            ticker: dbUpload.ticker,
          }
        : null,
      // Use correct Irys properties from UploadRow
      irys: dbUpload.irys_transaction_id
        ? {
            transaction_id: dbUpload.irys_transaction_id,
            url: dbUpload.irys_url,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching queue status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status", details: (error as Error).message },
      { status: 500 }
    );
  }
}
