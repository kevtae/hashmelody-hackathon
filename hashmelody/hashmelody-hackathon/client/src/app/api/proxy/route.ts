import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log("API Route Hit: /api/proxy");

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    console.log("Error: Missing 'url' query param");
    return NextResponse.json(
      { error: "Missing 'url' query param" },
      { status: 400 }
    );
  }

  try {
    console.log("Fetching URL:", url);
    const response = await fetch(url);

    if (!response.ok) {
      console.log("Error fetching from Mureka:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch from Mureka" },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error: unknown) {
    console.error("Proxy error:", error);

    let errorMessage = "An unknown error occurred";

    if (error instanceof Error) {
      errorMessage = error.message; // Extract error message safely
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
