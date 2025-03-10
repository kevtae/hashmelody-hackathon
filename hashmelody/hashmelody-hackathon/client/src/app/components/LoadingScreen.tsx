"use client";

import React from "react";
import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

interface LoadingScreenProps {
  progress: number;
  statusMessage: string;
  status?: string | null; // Make status an optional prop
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  statusMessage,
  status,
}) => {
  // Calculate synthetic progress for token creation phases
  const calculateSyntheticProgress = () => {
    // If we have a real progress value and not in token creation phase, use it
    if (progress > 0 && (!status || !status.includes("token"))) {
      return progress;
    }
    
    // Define the status sequence to calculate progress percentage
    const statusSequence = [
      "pending",
      "generating",
      "song_created",
      "downloading_mp3",
      "uploading_to_irys",
      "uploaded_to_irys",
      "creating_token",
      "token_created",
      "sending_reply",
      "completed"
    ];
    
    if (!status) return 10; // Default progress if no status
    
    // Handle special cases
    if (status === "failed") return 100;
    if (status === "token_creation_failed") return 85;
    
    // Find status in sequence
    const currentIndex = statusSequence.indexOf(status);
    if (currentIndex === -1) return 10; // Default if status not found
    
    // Calculate percentage based on position in sequence
    return Math.round((currentIndex / (statusSequence.length - 1)) * 100);
  };
  
  const displayProgress = calculateSyntheticProgress();

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <LoadingSpinner />
      <p className="mt-4 text-lg">{statusMessage}</p>

      {/* Progress bar */}
      <div className="w-full max-w-md mt-6">
        <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 text-right">{displayProgress}% complete</p>
      </div>
    </div>
  );
};

export default LoadingScreen;