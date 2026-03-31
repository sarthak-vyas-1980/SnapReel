import React from "react";

type ActionsCardProps = {
  reelUrl?: string | null;
  onDelete: () => void;
  isDeleting: boolean;
};

export default function ActionsCard({ reelUrl, onDelete, isDeleting }: ActionsCardProps) {
  const handleCopy = () => {
    if (reelUrl) {
      navigator.clipboard.writeText(reelUrl);
      alert("URL copied to clipboard!");
    }
  };

  return (
    <div className="pt-2">
      <div className="space-y-3">
        <a
          href={reelUrl || "#"}
          download
          className={`w-full flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:opacity-90 dark:hover:bg-gray-100 shadow-md transition-all ${
            !reelUrl ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          ⬇️ Download Reel
        </a>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!reelUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all disabled:opacity-50 shadow-sm"
          >
            🔗 Copy URL
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            🗑️ {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
