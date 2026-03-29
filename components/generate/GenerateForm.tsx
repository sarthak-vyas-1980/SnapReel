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
    <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube link here..."
          className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="bg-black text-white px-8 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap font-medium"
        >
          {loading ? "Initializing..." : "Generate Reel"}
        </button>
      </form>
    </div>
  );
}
