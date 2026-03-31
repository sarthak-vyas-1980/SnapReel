import React from "react";

type SourceVideoCardProps = {
  youtubeUrl: string;
};

export default function SourceVideoCard({ youtubeUrl }: SourceVideoCardProps) {
  const absoluteUrl = youtubeUrl.startsWith("http") ? youtubeUrl : `https://${youtubeUrl}`;

  return (
    <div className="pb-4">
      <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Source Video</h3>
      <div className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-slate-900/50 rounded-xl border dark:border-gray-700">
        <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-600 dark:text-red-500 flex items-center justify-center text-sm shrink-0">
          ▶
        </div>
        <a
          href={absoluteUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate hover:text-red-600 dark:hover:text-red-400 transition-all flex-1"
        >
          {youtubeUrl}
        </a>
      </div>
    </div>
  );
}
