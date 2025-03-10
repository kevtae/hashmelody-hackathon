// app/api/mureka/route.ts
import { NextResponse } from "next/server";
import { MurekaService } from "@/lib/services/mureka/api";
import { UploadsService } from "@/lib/services/supabase";

export async function POST(request: Request) {
  let uploadId: number | undefined;

  try {
    // Parse and validate request
    const body = await request.json();
    const { prompt } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ 
        error: "Invalid or missing prompt" 
      }, { status: 400 });
    }

    try {
      // Create initial upload record
      uploadId = await UploadsService.insertPrompt(prompt);
    } catch (dbError) {
      console.error("Database error creating upload:", dbError);
      return NextResponse.json({ 
        error: "Failed to initialize upload" 
      }, { status: 500 });
    }

    // Generate music
    let murekaResponse;
    try {
      console.log("called mureka api")
      murekaResponse = await MurekaService.generateMusic(prompt);
    } catch (murekaError) {
      console.error("Error generating music with MurekaService:", murekaError);
      if (uploadId) {
        await UploadsService.updateStatus(uploadId, 'failed');
      }
      return NextResponse.json({ 
        error: "Failed to generate music", 
        details: murekaError instanceof Error ? murekaError.message : "Unknown error"
      }, { status: 500 });
    }

    // Validate response
    if (!murekaResponse?.songs?.length) {
      if (uploadId) {
        await UploadsService.updateStatus(uploadId, 'failed');
      }
      return NextResponse.json({ 
        error: "No songs were generated" 
      }, { status: 400 });
    }

    // Get first song and validate required fields
    const song = murekaResponse.songs[0];
    if (!song.mp3_url || !song.title) {
      if (uploadId) {
        await UploadsService.updateStatus(uploadId, 'failed');
      }
      return NextResponse.json({ 
        error: "Invalid song data received" 
      }, { status: 400 });
    }

    // Update song details
    try {
      await UploadsService.updateSong(uploadId, song);
    } catch (updateError) {
      console.error("Failed to update song details:", updateError);
      if (uploadId) {
        await UploadsService.updateStatus(uploadId, 'failed');
      }
      return NextResponse.json({ 
        error: "Failed to save song details" 
      }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      uploadId,
      song: {
        title: song.title,
        duration_milliseconds: song.duration_milliseconds,
        genres: song.genres,
        moods: song.moods,
        mp3_url: song.mp3_url,
        cover: song.cover,
        share_link: song.share_link
      },
      metadata: {
        feed_id: murekaResponse.feed_id,
        state: murekaResponse.state,
        prompt,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Error in Mureka API:", error);

    // Always try to update status if we have an uploadId
    if (uploadId) {
      try {
        await UploadsService.updateStatus(uploadId, 'failed');
      } catch (statusError) {
        console.error("Failed to update status:", statusError);
      }
    }

    // Handle specific errors
    if (error instanceof Error) {
      switch (error.message) {
        case "MUREKA_API_TOKEN not set":
          return NextResponse.json({ 
            error: "Service configuration error" 
          }, { status: 500 });

        case "Mureka API error":
          console.error("Detailed Mureka API error:", error);
          return NextResponse.json({ 
            error: "Failed to generate music",
            details: error.message
          }, { status: 400 });

        default:
          return NextResponse.json({
            error: "An unexpected error occurred",
            details: error.message
          }, { status: 500 });
      }
    }

    // Generic error response
    return NextResponse.json({ 
      error: "An unexpected error occurred" 
    }, { status: 500 });
  }
}