import React from "react";

type Video = {
  id: string;
  youtubeUrl: string;
  status: string;
  progress: number;
  errorMessage?: string | null;
};

type ProcessingQueueProps = {
  activeVideos: Video[];
  onDismissError: (id: string) => Promise<void>;
};

export default function ProcessingQueue({ activeVideos, onDismissError }: ProcessingQueueProps) {
  return (
    <div className={`flex flex-col bg-white dark:bg-slate-800 rounded-3xl shadow-sm border dark:border-gray-700 p-6 md:p-8 transition-colors duration-200 ${activeVideos.length > 0 ? "flex-1 mt-4" : "mt-0"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <span className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-bold shadow-sm">
            {activeVideos.length}
          </span>
          Processing Queue
        </h2>
        {activeVideos.length > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium border border-green-100 dark:border-green-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Active
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {activeVideos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-12 bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">⌛</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Queue is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Paste a YouTube link above to begin generating your next viral reel.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeVideos.map((video) => (
              <div key={video.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition duration-200">
                <p className="text-gray-600 text-sm truncate mb-4 flex items-center gap-2" title={video.youtubeUrl}>
                  <span className="text-red-500">▶</span>
                  {video.youtubeUrl}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-800 dark:text-gray-200">{video.status}</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{video.progress || 0}%</span>
                </div>

                {(video.status === "processing" || video.status === "queued") && (
                  <div className="w-full bg-gray-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner border dark:border-gray-700">
                    <div
                      className={`${video.status === "queued" ? "bg-gray-300 dark:bg-gray-700 animate-pulse w-full" : "bg-gradient-to-r from-black via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-200"} h-3 transition-all duration-500 ease-in-out`}
                      style={{ width: video.status === "queued" ? "100%" : `${video.progress || 0}%` }}
                    />
                  </div>
                )}

                {video.status === "failed" && (
                  <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-800 dark:text-red-400 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-semibold mb-1">Processing Failed</p>
                        <p className="text-red-600 dark:text-red-300">{video.errorMessage || "An unexpected error occurred."}</p>
                        <button
                          onClick={() => onDismissError(video.id)}
                          className="mt-3 text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition duration-200"
                        >
                          Dismiss Error
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
