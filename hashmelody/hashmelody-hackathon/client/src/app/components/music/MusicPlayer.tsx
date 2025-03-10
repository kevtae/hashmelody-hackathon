// app/components/music/MusicPlayer.tsx
import React, { useState, useEffect, useRef } from "react";
import PlayerBar from "@/app/components/PlayerBar";
import { MurekaSongItem } from "@/lib/services/mureka/types";

interface MusicPlayerProps {
  musicData: MurekaSongItem;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ musicData }) => {
  // Audio states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Helper Functions
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds: number) => {
    if (!audioRef.current) return;
    let newTime = audioRef.current.currentTime + seconds;
    if (newTime < 0) newTime = 0;
    if (newTime > duration) newTime = duration;
    audioRef.current.currentTime = newTime;
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(event.target.value);
    audioRef.current.currentTime = newTime;
  };

  // Sync time states when audio is playing
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  return (
    <>
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={musicData?.mp3_url ?? musicData?.gatewayUrl ?? undefined}
        className="hidden"
      />

      {/* Bottom Player Bar */}
      <PlayerBar
        musicData={musicData}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSkipTime={skipTime}
        onSeek={handleSeek}
        formatTime={formatTime}
        tokenPrice={0}
        priceChange={0}
      />
    </>
  );
};

export default MusicPlayer;
