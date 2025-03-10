// app/page.tsx
"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { UploadsService } from "@/lib/services/supabase";
import Sidebar from "@/app/components/sidebar";
import MusicCard from "@/app/components/musiccard";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";
// import { ConnectWallet } from "@/app/components/shared/ConnectWallet";
import type { UploadRow } from "@/lib/services/supabase/types";
import Image from "next/image";

import { Heart, Share, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { ready } = usePrivy();

  const [songs, setSongs] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSongs() {
      try {
        setLoading(true);
        const data = await UploadsService.fetchUserUploads();
        setSongs(data);
      } catch (error) {
        console.error("Error fetching songs:", error);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSongs();
  }, []);

  // Loading state for the entire app
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-black text-white">
        <LoadingSpinner />
      </div>
    );
  }

  const popSongs = filterSongsByGenre(songs, "pop");

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />

      <main className="flex-1 p-6 pl-72">
        <>
          {/* MAIN LANDING PAGE CONTENT FOR AUTHENTICATED USER */}
          {/* Trending Songs Section */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">Trending Songs</h3>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {songs.length === 0 ? (
                  <p className="text-gray-400">No songs found.</p>
                ) : (
                  songs
                    .slice(0, 5)
                    .map((song) => (
                      <MusicCard
                        key={song.id}
                        id={`${song.id}`}
                        title={song.title ?? "Untitled"}
                        genre={formatGenres(song.genres)}
                        duration={formatDuration(song.duration_milliseconds)}
                        thumbnail={song.cover ?? "/api/placeholder/150/150"}
                      />
                    ))
                )}
              </div>
            )}
          </section>
          {/* For You Section */}
          <section className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">For You</h3>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {songs.length === 0 ? (
                  <p className="text-gray-400">No songs found.</p>
                ) : (
                  songs
                    .slice(5, 10)
                    .map((song) => (
                      <MusicCard
                        key={song.id}
                        id={`${song.id}`}
                        title={song.title ?? "Untitled"}
                        genre={formatGenres(song.genres)}
                        duration={formatDuration(song.duration_milliseconds)}
                        thumbnail={song.cover ?? "/api/placeholder/150/150"}
                      />
                    ))
                )}
              </div>
            )}
          </section>

          <section className="mb-12">
            {/* Header row: Section title on the left, "More" link on the right */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold">Pop</h3>
              <a
                href="#"
                className="text-white flex items-center hover:text-gray-300 transition-colors"
              >
                More <ChevronRight size={20} />
              </a>
            </div>

            {/* The grid of song cards matching the image layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {popSongs.length > 0 ? (
                popSongs.slice(0, 6).map((song) => (
                  <div
                    key={song.id}
                    className="flex flex-col md:flex-row group rounded-lg overflow-hidden bg-gray-900"
                  >
                    {/* 
              A single Link for the thumbnail + title text 
              so the user can click the 'main area' to visit the song page 
            */}
                    <Link href={`/music/${song.id}`} className="flex flex-1">
                      {/* Thumbnail */}
                      <Image
                        src={song.cover ?? "/api/placeholder/150/150"}
                        alt={song.title ?? "Untitled"}
                        width={500}
                        height={500}
                        className="w-24 h-24 object-cover"
                      />
                      {/* Main text area */}
                      <div className="flex flex-col justify-center flex-1 p-4">
                        <h4 className="text-base font-medium line-clamp-1">
                          {song.title ?? "Untitled"}
                        </h4>
                        {/* Genre + Moods */}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatGenres(song.genres)}{" "}
                          {song.moods ? `| ${formatMoods(song.moods)}` : ""}
                        </p>
                      </div>
                    </Link>

                    {/* Actions (outside the link) */}
                    <div className="flex items-center space-x-3 p-4">
                      <button className="text-gray-500 hover:text-white transition-colors">
                        <Heart size={20} />
                      </button>
                      <button className="text-gray-500 hover:text-white transition-colors">
                        <Share size={20} />
                      </button>
                      <Link href="/upload">
                        <button className="bg-gray-700 text-white text-xs px-3 py-1 rounded-full hover:bg-gray-600 transition-colors whitespace-nowrap">
                          Create similar
                        </button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No pop songs found.</p>
              )}
            </div>
          </section>

          {/* New Songs Section */}
          <section>
            <h3 className="text-2xl font-semibold mb-4">New Songs</h3>
            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {songs.length === 0 ? (
                  <p className="text-gray-400">No songs found.</p>
                ) : (
                  songs
                    .slice(10)
                    .map((song) => (
                      <MusicCard
                        key={song.id}
                        id={`${song.id}`}
                        title={song.title ?? "Untitled"}
                        genre={formatGenres(song.genres)}
                        duration={formatDuration(song.duration_milliseconds)}
                        thumbnail={song.cover ?? "/api/placeholder/150/150"}
                      />
                    ))
                )}
              </div>
            )}
          </section>
        </>
      </main>
    </div>
  );
}

// Utility functions
function formatGenres(genres: string | null): string | undefined {
  if (!genres) return undefined;
  try {
    // Handle JSON-formatted genres
    const parsed = JSON.parse(genres);
    return Array.isArray(parsed) ? parsed.join(", ") : genres;
  } catch {
    return genres;
  }
}

function formatDuration(ms: string | null): string {
  if (!ms) return "Unknown";
  const numericMs = Number(ms);
  const totalSeconds = Math.floor(numericMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function parseGenres(genres: string | null): string[] {
  if (!genres) return [];
  try {
    const parsed = JSON.parse(genres);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // If parsing fails, return an empty array
    return [];
  }
}

function filterSongsByGenre(songs: UploadRow[], genre: string): UploadRow[] {
  return songs.filter((song) => {
    const genresArr = parseGenres(song.genres);
    return genresArr.includes(genre);
  });
}

function formatMoods(moods: string | null): string {
  if (!moods) return "";
  try {
    const parsed = JSON.parse(moods);
    return Array.isArray(parsed) ? parsed.join(" ") : moods;
  } catch {
    return moods;
  }
}
