import React from "react";

type ReelInfoCardProps = {
  status: string;
  duration: number;
  createdAt?: string;
  timestamps?: { start: number; end: number } | null;
  startPct: number;
  widthPct: number;
};

export default function ReelInfoCard({
  status,
  duration,
  createdAt,
  timestamps,
  startPct,
  widthPct,
}: ReelInfoCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 capitalize">{status}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Duration</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{duration} sec</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Created At</p>
        <p suppressHydrationWarning className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {createdAt ? new Date(createdAt).toLocaleString() : "N/A"}
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Clip Selection</p>
        {timestamps ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center bg-white dark:bg-slate-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 w-[45%] shadow-sm text-gray-900 dark:text-white">
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {Math.floor(timestamps.start / 60)}:
                  {String(Math.floor(timestamps.start % 60)).padStart(2, "0")}
                </p>
              </div>
              <span className="text-gray-400 font-bold text-sm">→</span>
              <div className="text-center bg-white dark:bg-slate-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700 w-[45%] shadow-sm text-gray-900 dark:text-white">
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                  {Math.floor(timestamps.end / 60)}:{String(Math.floor(timestamps.end % 60)).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="w-full">
              <div className="relative w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden border dark:border-gray-700 shadow-inner">
                <div
                  className="absolute h-full bg-black dark:bg-white rounded-full shadow-sm"
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-400 italic text-sm">Clip data unavailable</p>
        )}
      </div>
    </div>
  );
}
