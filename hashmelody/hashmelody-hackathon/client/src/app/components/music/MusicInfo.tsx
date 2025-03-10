// app/components/music/MusicInfo.tsx
import React from "react";
import MusicInfoCard from "@/app/components/MusicInfoCard";
import SimplePriceDisplay from "@/app/components/SimplePriceDisplay";
import { MurekaSongItem } from "@/lib/services/mureka/types";

interface MusicInfoProps {
  musicData: MurekaSongItem;
  onGenerateAnother: () => void;
  uploadId: string;
  status: string | null;
}

const MusicInfo: React.FC<MusicInfoProps> = ({
  musicData,
  onGenerateAnother,
  uploadId,
  status,
}) => {
  return (
    <>
      <MusicInfoCard
        musicData={musicData}
        tokenPrice={0}
        priceChange={0}
        onGenerateAnother={onGenerateAnother}
      />

      {/* Price display for the token */}
      {musicData.token_mint && (
        <div className="mt-4">
          <SimplePriceDisplay mintAddress={musicData.token_mint} />
        </div>
      )}

      {/* Debug information */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 bg-zinc-800 rounded-lg text-xs">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <pre className="whitespace-pre-wrap break-all">
            {JSON.stringify(
              {
                id: uploadId,
                status,
                token_mint: musicData.token_mint,
                token_signature: musicData.token_signature,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </>
  );
};

export default MusicInfo;
