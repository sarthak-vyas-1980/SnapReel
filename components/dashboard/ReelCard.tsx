import React, { useState } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "../shared/StatusBadge";

type Video = {
  id: string;
  youtubeUrl: string;
  title?: string | null;
  status: string;
  progress: number;
  createdAt?: string;
  errorMessage?: string | null;
};

type ReelCardProps = {
  video: Video;
  onRename: (videoId: string, newTitle: string) => Promise<void>;
  onRetry: (videoId: string) => Promise<void>;
};

export default function ReelCard({ video, onRename, onRetry }: ReelCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(video.title || "");

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onRename(video.id, newTitle);
    setIsEditing(false);
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry(video.id);
  };

  return (
    <div
      onClick={() => router.push(`/reel/${video.id}`)}
      className={`bg-white rounded-2xl shadow-sm border p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-[224px] relative group overflow-hidden ${
        video.status === 'failed' ? 'border-red-100 hover:border-red-200' : ''
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gray-100">
        {video.status === "processing" && (
          <div className="h-full bg-blue-500 animate-pulse transition-all" style={{ width: `${video.progress}%` }} />
        )}
        {video.status === "queued" && <div className="h-full bg-yellow-400 w-1/4 animate-pulse" />}
        {video.status === "completed" && <div className="h-full bg-green-500 w-full" />}
        {video.status === "failed" && <div className="h-full bg-red-500 w-full" />}
      </div>

      <div className="flex-1 mt-2">
        {isEditing ? (
          <div className="flex flex-col gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 px-2 py-1.5 rounded-lg w-full font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-sm"
              placeholder="Reel Title..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-black text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition-all shadow-sm"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-white text-gray-700 px-3 py-2 rounded-lg font-bold text-xs border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start mb-2 gap-4">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2" title={video.title || "Untitled Reel"}>
              {video.title || "Untitled Reel"}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setNewTitle(video.title || "");
              }}
              className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 hover:bg-black hover:text-white rounded-md transition opacity-0 group-hover:opacity-100 shrink-0"
            >
              Rename
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <StatusBadge status={video.status} />
          {video.createdAt && (
            <span suppressHydrationWarning className="text-xs font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md border">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {video.status === "failed" && video.errorMessage && (
          <p className="text-xs text-red-500 font-medium line-clamp-2 mt-1">
            ⚠️ {video.errorMessage}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t flex items-center justify-between gap-3">
        {video.status === "failed" ? (
          <button
            onClick={handleRetryClick}
            className="flex-1 bg-black text-white py-1.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            🔄 Retry Generation
          </button>
        ) : (
          <span className="text-sm font-semibold text-blue-600 group-hover:underline">View Reel →</span>
        )}
        
        {video.status !== "failed" && (
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition shrink-0">
            ↗
          </div>
        )}
      </div>
    </div>
  );
}
