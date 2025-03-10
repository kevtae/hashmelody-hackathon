"use client";

import React from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  MoreVertical,
  DollarSign,
} from "lucide-react";
import { MurekaSongItem } from "@/lib/services/mureka/types";

interface PlayerBarProps {
  musicData?: MurekaSongItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSkipTime: (seconds: number) => void;
  onSeek: (event: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
  tokenPrice: number;
  priceChange: number;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  musicData,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSkipTime,
  onSeek,
  formatTime,
  tokenPrice,
  priceChange,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 p-3 border-t border-zinc-800">
      <div className="flex items-center w-full max-w-7xl mx-auto gap-4">
        {/* Cover and info */}
        <div className="flex items-center min-w-[200px] max-w-[240px]">
          <div className="relative h-14 w-14 rounded-md overflow-hidden mr-3 shadow-lg">
            <Image
              src={musicData?.cover || "/api/placeholder/150/150"}
              alt={musicData?.title ?? "Untitled"}
              width={56}
              height={56}
              className="h-14 w-14 object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium truncate">
              {musicData?.title ?? "Untitled"}
            </span>
            <span className="text-zinc-400 text-xs truncate">
              {musicData?.ticker ?? "GTZY"}
              {/* {musicData?.artist ?? "GTZY"} */}
            </span>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex-1 max-w-xl">
          {/* Progress bar */}
          <div className="mb-2 relative group">
            <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden group-hover:h-2 transition-all">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={duration}
              step="0.01"
              value={currentTime}
              onChange={onSeek}
              className="absolute inset-0 w-full h-1 cursor-pointer opacity-0"
            />
          </div>

          {/* Time display and controls */}
          <div className="flex items-center justify-between">
            {/* Time display */}
            <div className="text-zinc-400 text-xs font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onSkipTime(-10)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={onTogglePlay}
                className="bg-emerald-500 hover:bg-emerald-400 text-black rounded-full p-3 transition-all"
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>

              <button
                onClick={() => onSkipTime(10)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <SkipForward size={18} />
              </button>

              <button className="text-zinc-400 hover:text-white transition-colors">
                <Repeat size={16} />
              </button>
            </div>

            {/* Token price display in player */}
            <div className="flex items-center text-xs">
              <DollarSign size={14} className="mr-1 text-emerald-500" />
              <span className="font-medium mr-1">{tokenPrice.toFixed(2)}</span>
              <span
                className={
                  priceChange >= 0 ? "text-emerald-500" : "text-red-500"
                }
              >
                {priceChange >= 0 ? "+" : ""}
                {priceChange}%
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800">
            <ThumbsUp size={18} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800">
            <ThumbsDown size={18} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800">
            <MessageSquare size={18} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800">
            <Share2 size={18} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors p-2 rounded-full hover:bg-zinc-800">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
