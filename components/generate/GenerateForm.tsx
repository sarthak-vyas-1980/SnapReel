import React, { useState } from "react";

export default function GenerateForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);

    await fetch("/api/video/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl: url }),
    });

    setUrl("");
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border dark:border-gray-700 mb-6 transition-colors duration-200">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube link here..."
          className="flex-1 border dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl hover:opacity-90 dark:hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 whitespace-nowrap font-bold shadow-md"
        >
          {loading ? "Initializing..." : "Generate Reel"}
        </button>
      </form>
    </div>
  );
}
