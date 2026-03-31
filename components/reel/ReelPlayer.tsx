import React from "react";
import Loader from "../shared/Loader";
import EmptyState from "../shared/EmptyState";

type ReelPlayerProps = {
  reelUrl?: string | null;
  status: string;
};

export default function ReelPlayer({ reelUrl, status }: ReelPlayerProps) {
  const isProcessing = status === "processing" || status === "queued";

  return (
    <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden min-h-[400px]">
      {reelUrl ? (
        <video
          key={reelUrl}
          src={reelUrl}
          controls
          autoPlay
          className="w-full h-full max-h-[600px] object-contain rounded-xl shadow-2xl"
        />
      ) : isProcessing ? (
        <div className="text-center p-12 text-white flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-white rounded-full animate-spin mb-6" />
          <p className="text-xl font-bold mb-2">Analyzing & Editing...</p>
          <p className="text-gray-400 font-medium">Sit tight! We are capturing the best moment.</p>
        </div>
      ) : (
        <EmptyState icon="🎬" title="No media available." />
      )}
    </div>
  );
}
