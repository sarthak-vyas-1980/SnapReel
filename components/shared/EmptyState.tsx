import React from "react";

export default function EmptyState({
  icon = "🎬",
  title = "No data available",
  description,
}: {
  icon?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="text-center p-12 text-gray-500 flex flex-col items-center">
      <span className="text-6xl block mb-6 opacity-30">{icon}</span>
      <p className="text-xl font-bold">{title}</p>
      {description && <p className="text-sm mt-2 opacity-80">{description}</p>}
    </div>
  );
}
