// src/components/MusicCard/index.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface MusicCardProps {
  id: string;
  title: string;
  genre?: string;
  duration: string;
  thumbnail: string;
}

export default function MusicCard({
  id,
  title,
  genre,
  duration,
  thumbnail,
}: MusicCardProps) {
  const router = useRouter();

  return (
    <div
      className="cursor-pointer bg-gray-900 rounded-lg p-4 w-48 hover:bg-gray-800"
      onClick={() => router.push(`/music/${id}`)}
    >
      <div className="h-48 bg-gray-700 rounded-lg mb-2 overflow-hidden">
        <Image
          src={thumbnail || "/api/placeholder/150/150"}
          alt={title}
          width={150}
          height={150}
          className="w-full h-full object-cover rounded"
        />
      </div>
      <h3 className="text-sm font-medium text-white truncate">{title}</h3>
      <p className="text-xs text-gray-400 truncate">{genre}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-400">{duration}</span>
      </div>
    </div>
  );
}
