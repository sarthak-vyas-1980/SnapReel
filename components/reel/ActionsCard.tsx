import React from "react";

type ActionsCardProps = {
  reelUrl?: string | null;
  thumbnailUrl?: string | null;
  onDelete: () => void;
  isDeleting: boolean;
};

export default function ActionsCard({ reelUrl, thumbnailUrl, onDelete, isDeleting }: ActionsCardProps) {
  const handleCopy = () => {
    if (reelUrl) {
      navigator.clipboard.writeText(reelUrl);
      alert("URL copied to clipboard!");
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback if fetch fails (e.g. CORS issues)
      window.open(url, '_blank');
    }
  };

  return (
    <div className="pt-2">
      <div className="space-y-2.5">
        <button
          onClick={() => reelUrl && handleDownload(reelUrl, "reel.mp4")}
          className={`w-full flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl hover:opacity-90 dark:hover:bg-gray-100 shadow-sm transition-all ${
            !reelUrl ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          ⬇️ Download Reel
        </button>

        <button
          onClick={() => thumbnailUrl && handleDownload(thumbnailUrl, "thumbnail.jpg")}
          className={`w-full flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-gray-300 border dark:border-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all ${
            !thumbnailUrl ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          🖼️ Save Thumbnail
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!reelUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border dark:border-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            🔗 Copy Link
          </button>
      <button
        onClick={onDelete}
        disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 border border-red-100 dark:border-red-900/20 transition-all disabled:opacity-50"
      >
            🗑️ {isDeleting ? "Delete" : "Delete"}
      </button>
        </div>
      </div>
    </div>
  );
}
