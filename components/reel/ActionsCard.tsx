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
          className={`w-full flex items-center justify-center gap-2 py-3 bg-black text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-md transition-all ${
            !reelUrl ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          ⬇️ Download Reel
        </a>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            disabled={!reelUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-gray-900 border-2 border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
          >
            🔗 Copy URL
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 border border-red-100 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
          >
            🗑️ {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
