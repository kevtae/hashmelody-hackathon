// lib/services/mureka/api.ts
import type { MurekaApiResponse } from "./types";

export class MurekaService {
  private static API_URL = "https://api.useapi.net/v1/mureka/music/create";

  public static async generateMusic(
    prompt: string
  ): Promise<MurekaApiResponse> {
    const apiToken = process.env.MUREKA_API_TOKEN;
    if (!apiToken) throw new Error("MUREKA_API_TOKEN not set");

    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error:", errorText);
      console.error("Mureka API error:", {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
      });
      throw new Error("Mureka API error");
    }

    const data: MurekaApiResponse = await response.json();
    return data;
  }
}
