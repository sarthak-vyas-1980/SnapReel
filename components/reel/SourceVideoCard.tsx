import React from "react";

type SourceVideoCardProps = {
  youtubeUrl: string;
};

export default function SourceVideoCard({ youtubeUrl }: SourceVideoCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Source Video</h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
            ▶
          </div>
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-gray-700 truncate hover:text-red-600 hover:underline transition-all flex-1"
          >
            {youtubeUrl}
          </a>
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full text-center py-2.5 bg-white text-gray-700 font-bold text-sm rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 justify-center"
        >
          <span>↗️</span> Open Original
        </a>
      </div>
    </div>
  );
}
