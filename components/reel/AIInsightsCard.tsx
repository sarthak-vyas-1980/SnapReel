import React from "react";

type AIInsightsCardProps = {
  hookScore?: number;
  engagementLevel?: string;
};

export default function AIInsightsCard({ hookScore = 92, engagementLevel = "High" }: AIInsightsCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl flex flex-col justify-center items-center text-white shadow-sm overflow-hidden relative group">
        <div className="absolute -right-4 -top-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🎯</div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 z-10">Hook Score</p>
        <p className="text-4xl font-black z-10 tracking-tight">
          {hookScore}<span className="text-sm opacity-60 font-medium ml-1">/100</span>
        </p>
      </div>
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-4 rounded-xl flex flex-col justify-center items-center text-white shadow-sm overflow-hidden relative group">
        <div className="absolute -right-4 -bottom-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🔥</div>
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 z-10">Engagement Level</p>
        <p className="text-2xl font-black z-10 tracking-tight mt-1">{engagementLevel}</p>
      </div>
    </div>
  );
}
