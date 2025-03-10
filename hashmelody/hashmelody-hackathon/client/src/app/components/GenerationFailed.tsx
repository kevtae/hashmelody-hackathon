"use client";

import React from "react";

interface GenerationFailedProps {
  // We could pass just a callback or the router itself.
  onRetry?: () => void;
}

const GenerationFailed: React.FC<GenerationFailedProps> = ({ onRetry }) => {
  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-red-900/30 border border-red-700 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-300">
        Generation Failed
      </h2>
      <p className="text-gray-300">
        We couldn&apos;t generate your music. Please try again with a different
        prompt.
      </p>
      <button
        onClick={onRetry}
        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-full"
      >
        Try Again
      </button>
    </div>
  );
};

export default GenerationFailed;
