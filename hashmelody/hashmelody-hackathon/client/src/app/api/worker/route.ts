import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { UploadsService } from "@/lib/services/supabase";
import { MurekaService } from "@/lib/services/mureka/api";
import { IrysService } from "@/lib/services/irys/upload";
import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import OpenAI from "openai";
import { Redis } from "@upstash/redis";
import { UploadStatus } from "@/lib/services/supabase/types";
import { createTokenWithServiceWallet as createToken } from "@/lib/services/token/create";
import { TokenAuthorizationStorage } from "@/lib/services/token/auth";
import { DirectRequestData } from "@/lib/interface";

import {
  NeynarPageImageAspectRatioEnum,
  NeynarPageButtonActionTypeEnum,
} from "@neynar/nodejs-sdk/build/api";

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Neynar
const neynarClient = new NeynarAPIClient(
  new Configuration({
    apiKey: process.env.NEYNAR_API_KEY!,
    basePath: "https://api.neynar.com/v2",
  })
);

// Helper function to update status in both Redis and database
async function updateStatus(uploadId: number, status: UploadStatus) {
  try {
    const redisKey = `music_generation_${uploadId}`;
    await redis.set(redisKey, status, { ex: 3600 });
    console.log(`Updated Redis status for ${uploadId} to: ${status}`);

    await UploadsService.updateStatus(uploadId, status);
    console.log(`Updated database status for ${uploadId} to: ${status}`);
  } catch (error) {
    console.error(`Error updating status for ${uploadId}:`, error);
  }
}

async function extractMusicPrompt(castText: string): Promise<string | null> {
  try {
    const promptText = `
      Extract a concise music prompt from this user's message. The prompt should be 5-15 words long and describe a song's genre, mood, or theme.
      If the message is unrelated to music, return "NULL".

      User's message: "${castText}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "system", content: promptText }],
      max_tokens: 30,
    });

    const extractedPrompt = response.choices[0]?.message?.content?.trim();
    if (!extractedPrompt || extractedPrompt.toUpperCase() === "NULL") {
      return null;
    }

    return extractedPrompt;
  } catch (error) {
    console.error("OpenAI error:", error);
    return null;
  }
}

async function sendFrameReply(
  castHash: string,
  username: string,
  musicData: { title: string; cover?: string },
  uploadId: number
) {
  try {
    const signerUuid = process.env.SIGNER_UUID!;
    const musicLink = `https://hashmelody.vercel.app/music/${uploadId}`;

    const frameCreationRequest = {
      name: `New Music for ${username}`,
      pages: [
        {
          uuid: crypto.randomUUID(), // Generate a unique UUID
          version: "vNext",
          image: {
            url: musicData.cover || "https://example.com/default-cover.jpg",
            aspect_ratio: NeynarPageImageAspectRatioEnum._11,
          },
          title: musicData.title,
          buttons: [
            {
              action_type: NeynarPageButtonActionTypeEnum.Link,
              title: "🎧 Listen",
              target: musicLink,
              index: 1,
            },
          ],
        },
      ],
    };

    const frame = await neynarClient.publishNeynarFrame(frameCreationRequest);

    await neynarClient.publishCast({
      signerUuid,
      text: `🎵 Here's your generated track!\n${musicLink}`,
      parent: castHash,
      embeds: [{ url: frame.link }],
    });
  } catch (error) {
    console.error("Error sending frame reply:", error);
  }
}

async function processFarcasterCast(cast: {
  text: string;
  author: {
    custody_address: string;
    username: string; // ✅ Change this to a string
    fid: number;
  };
  hash: string;
}) {
  const prompt = await extractMusicPrompt(cast.text);
  if (!prompt) {
    return;
  }

  const uploadId = await UploadsService.insertPrompt(prompt);

  try {
    await updateStatus(uploadId, "pending");
    await updateStatus(uploadId, "generating");

    const murekaResponse = await MurekaService.generateMusic(prompt);
    if (!murekaResponse?.songs?.length) {
      throw new Error("No songs generated");
    }

    const song = murekaResponse.songs[0];

    await UploadsService.updateSong(uploadId, song);
    await updateStatus(uploadId, "song_created");

    await updateStatus(uploadId, "uploading_to_irys");

    const ticker = generateTicker(song.title); // Replace "DEFAULT_TICKER" with your desired default.

    if (!song.mp3_url) {
      throw new Error("MP3 URL is missing or invalid.");
    }

    const response = await fetch(song.mp3_url);
    const blob = await response.blob();
    const file = new File([blob], `${song.title}.mp3`, { type: "audio/mp3" });

    const irysResult = await IrysService.upload({
      file,
      userId: String(cast.author.fid),
      walletAddress: cast.author.custody_address,
      metadata: {
        uploadId: uploadId.toString(),
        title: song.title,
        genres: song.genres || [],
        moods: song.moods || [],
        duration_milliseconds: song.duration_milliseconds?.toString(),
        cover: song.cover,
        share_link: song.share_link,
      },
    });

    await UploadsService.updateIrysInfo(uploadId, irysResult);
    await updateStatus(uploadId, "uploaded_to_irys");

    if (
      cast.author.custody_address &&
      cast.author.custody_address.startsWith("0x")
    ) {
      try {
        await updateStatus(uploadId, "creating_token");
        if (!song.ticker) {
          console.log("Song ticker is missing, using default.");
          song.title = "Untitled";
        }

        const tokenResult = await createToken(
          uploadId,
          ticker,
          irysResult.gatewayUrl,
          cast.author.custody_address
        );

        await UploadsService.updateTokenInfo(uploadId, {
          mint: tokenResult.mint,
          signature: tokenResult.signatures,
          userSigned: false,
        });

        await updateStatus(uploadId, "token_created");
      } catch (error) {
        console.error("Error creating token:", error);
        await updateStatus(uploadId, "token_creation_failed");
      }
    }

    await updateStatus(uploadId, "sending_reply");
    await sendFrameReply(
      cast.hash,
      cast.author.username,
      {
        title: song.title ?? "Untitled", // ✅ Ensure `title` is always a string
      },
      uploadId
    );

    await updateStatus(uploadId, "completed");

    await updateStatus(uploadId, "completed");
  } catch (error) {
    console.error("Error processing cast:", error);
    if (uploadId) {
      await updateStatus(uploadId, "failed");
    }
    throw error;
  }
}

async function processDirectRequest(data: DirectRequestData) {
  const {
    prompt,
    userId,
    walletAddress,
    chainType,
    uploadId: existingUploadId,
    requestId,
  } = data;
  const uploadId =
    existingUploadId || (await UploadsService.insertPrompt(prompt));

  console.log("Chain Type:", chainType);
  console.log("Wallet Address:", walletAddress);
  console.log("requestId", requestId);

  try {
    await updateStatus(uploadId, "pending");
    await updateStatus(uploadId, "generating");

    const murekaResponse = await MurekaService.generateMusic(prompt);
    if (!murekaResponse?.songs?.length) {
      throw new Error("No songs generated");
    }

    const song = murekaResponse.songs[0];
    song.title = song.title ?? "untitled";
    console.log("song", song);
    console.log("song.title", song.title);
    await UploadsService.updateSong(uploadId, song);
    await updateStatus(uploadId, "song_created");

    const ticker = generateTicker(song.title) ?? "DEFAULT_TICKER"; // Replace "DEFAULT_TICKER" with your desired default.
    console.log("ticker: ", ticker);
    await UploadsService.updateTicker(uploadId, ticker);
    // Fetch the MP3 file from Mureka
    await updateStatus(uploadId, "downloading_mp3");
    console.log("Fetching MP3 from Mureka URL:", song.mp3_url);
    if (!song.mp3_url) {
      throw new Error("MP3 URL is missing or invalid.");
    }
    const response = await fetch(song.mp3_url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch MP3: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`MP3 file fetched, size: ${buffer.length} bytes`);

    // Upload to Irys
    await updateStatus(uploadId, "uploading_to_irys");
    const irysResult = await IrysService.upload({
      file: buffer,
      userId,
      walletAddress: walletAddress ?? "",
      metadata: {
        uploadId: uploadId.toString(),
        title: song.title || "Untitled",
        genres: Array.isArray(song.genres) ? song.genres : [],
        moods: Array.isArray(song.moods) ? song.moods : [],
        duration_milliseconds: song.duration_milliseconds?.toString() || "0",
        cover: song.cover || "",
        share_link: song.share_link || "",
      },
    });

    // Extract the unique part of the gateway URL
    const gatewayUrl = irysResult.gatewayUrl.replace(
      "https://gateway.irys.xyz/",
      ""
    );
    console.log("Upload successful! Updating database with Irys info...");
    await UploadsService.updateIrysInfo(uploadId, {
      ...irysResult,
      gatewayUrl,
    });
    await updateStatus(uploadId, "uploaded_to_irys");

    // Inside processDirectRequest function
    if (chainType === "solana" && walletAddress) {
      try {
        await updateStatus(uploadId, "creating_token");

        if (!requestId) {
          throw new Error("Request ID is required for token creation");
        }

        console.log("Checking authorization for:", {
          requestId,
          walletAddress,
        });

        const authData = await TokenAuthorizationStorage.getAuthorization(
          requestId
        );
        console.log("Retrieved auth data:", authData);

        if (!authData) {
          throw new Error(
            `No authorization found for request ID: ${requestId}`
          );
        }

        if (authData.used) {
          throw new Error(
            `Authorization already used for request ID: ${requestId}`
          );
        }

        if (
          authData.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
        ) {
          throw new Error(
            `Wallet address mismatch. Expected: ${authData.walletAddress}, Got: ${walletAddress}`
          );
        }

        if (!song.title) {
          console.log("Song title is missing, using default.");
          song.title = "Untitled";
        }

        // Create the token first before marking the authorization as used
        const tokenResult = await createToken(
          uploadId,
          ticker,
          gatewayUrl,
          walletAddress
        );

        // Only mark the authorization as used after successful token creation
        await TokenAuthorizationStorage.markAsUsed(requestId);

        await UploadsService.updateTokenInfo(uploadId, {
          mint: tokenResult.mint,
          signature: tokenResult.signatures,
          userSigned: true,
        });

        await updateStatus(uploadId, "token_created");
      } catch (error) {
        console.error("Detailed token creation error:", {
          error: error instanceof Error ? error.message : "Unknown error",
          requestId,
          walletAddress,
          chainType,
        });
        await updateStatus(uploadId, "token_creation_failed");
        throw error;
      }
    }

    await updateStatus(uploadId, "completed");
    return { uploadId };

    // Final status update
    await updateStatus(uploadId, "completed");
  } catch (error) {
    console.error("Error processing direct request:", error);
    if (uploadId) {
      await updateStatus(uploadId, "failed");
    }
    throw error;
  }
}

export const POST = verifySignatureAppRouter(async (req: NextRequest) => {
  try {
    console.log("workers called")
    const body = await req.json();
    console.log("Worker called with body type:", body);

    if (body.type === "farcaster") {
      await processFarcasterCast(body.cast);
    } else {
      await processDirectRequest(body);
    }

    return NextResponse.json({ message: "Processing completed successfully" });
  } catch (error) {
    console.error("Worker error:", error);
    return NextResponse.json(
      {
        error: "Worker failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
});

function generateTicker(title?: string | null): string {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "of",
    "in",
    "to",
    "for",
    "with",
    "on",
    "at",
    "by",
    "from",
    "it",
    "is",
    "that",
    "this",
  ]);

  const titleText = title || "";

  // Extract meaningful words
  const words = titleText
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  let ticker = "";

  // Build ticker from word segments
  for (const word of words) {
    // Take up to 2 characters from each word
    ticker += word.substring(0, 2).toUpperCase();
    // Stop when we reach 6 characters
    if (ticker.length >= 6) break;
  }

  // Trim to max 6 characters
  ticker = ticker.substring(0, 6);

  // Ensure minimum length with random characters if needed
  if (ticker.length < 3) {
    const needed = 3 - ticker.length;
    const random = Math.random()
      .toString(36)
      .substring(2, 2 + needed)
      .toUpperCase();
    ticker += random;
  }

  // Fallback for empty prompts
  if (ticker.length === 0) {
    const length = Math.floor(Math.random() * 4) + 3; // Random 3-6 length
    ticker = Math.random()
      .toString(36)
      .substring(2, 2 + length)
      .toUpperCase();
  }

  return ticker;
}
