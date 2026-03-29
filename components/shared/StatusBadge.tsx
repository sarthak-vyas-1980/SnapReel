import React from 'react';

type StatusBadgeProps = {
  status: string;
  progress?: number;
};

export default function StatusBadge({ status, progress }: StatusBadgeProps) {
  const isPolling = status === "processing" || status === "queued";
  
  const getStatusClasses = () => {
    if (status === "completed") return "bg-green-100 text-green-700 border-green-200";
    if (isPolling) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (status === "failed") return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="flex items-center gap-3 bg-gray-50 py-2 px-4 rounded-xl border border-gray-200 flex-shrink-0">
      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusClasses()} uppercase tracking-wider`}>
        {status}
      </span>
      {isPolling && (
        <span className="flex h-3 w-3 relative ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      )}
      {progress !== undefined && (
        <span className="text-sm font-bold text-gray-700 font-mono">
          {progress}%
        </span>
      )}
    </div>
  );
}
