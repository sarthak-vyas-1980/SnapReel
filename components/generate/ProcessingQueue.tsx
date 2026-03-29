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
    <div className={`flex flex-col bg-white rounded-3xl shadow-sm border p-6 md:p-8 ${activeVideos.length > 0 ? "flex-1 mt-4" : "mt-0"}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-sm">
            {activeVideos.length}
          </span>
          Processing Queue
        </h2>
        {activeVideos.length > 0 && (
          <span className="text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-medium border border-green-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Active
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {activeVideos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 lg:py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">⌛</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Queue is empty</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Paste a YouTube link above to begin generating your next viral reel.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
                <p className="text-gray-600 text-sm truncate mb-4 flex items-center gap-2" title={video.youtubeUrl}>
                  <span className="text-red-500">▶</span>
                  {video.youtubeUrl}
                </p>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-800">{video.status}</span>
                  <span className="text-sm font-medium text-gray-500">{video.progress || 0}%</span>
                </div>

                {(video.status === "processing" || video.status === "queued") && (
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className={`${video.status === "queued" ? "bg-gray-300 animate-pulse w-full" : "bg-gradient-to-r from-black to-gray-700"} h-3 transition-all duration-500 ease-in-out`}
                      style={{ width: video.status === "queued" ? "100%" : `${video.progress || 0}%` }}
                    />
                  </div>
                )}

                {video.status === "failed" && (
                  <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="font-semibold mb-1">Processing Failed</p>
                        <p className="text-red-600">{video.errorMessage || "An unexpected error occurred."}</p>
                        <button
                          onClick={() => onDismissError(video.id)}
                          className="mt-3 text-xs font-semibold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition"
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
