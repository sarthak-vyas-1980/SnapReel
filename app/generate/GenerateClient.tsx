"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Video = {
  id: string
  youtubeUrl: string
  title?: string | null
  status: string
  progress: number
  thumbnailUrl?: string | null
  reelUrl?: string | null
  errorMessage?: string | null
}

export default function GenerateClient({
  videos: initialVideos,
}: {
  videos: Video[]
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)

    await fetch("/api/video/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ youtubeUrl: url }),
    })

    setUrl("")
    setLoading(false)
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/video/status")
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const activeVideos = (Array.isArray(videos) ? videos : []).filter(
    (v) => v.status === "processing" || v.status === "queued" || v.status === "failed"
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-12 w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              ✨ Generate Reel
            </h1>
            <p className="text-gray-500 mt-2">
              Paste a YouTube link to start processing your next viral reel.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-black hover:underline transition whitespace-nowrap">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Input Form */}
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
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap font-medium"
            >
              {loading ? "Initializing..." : "Generate Reel"}
            </button>
          </form>
        </div>

        {/* Active Generations */}
        <div className={`flex flex-col bg-white rounded-3xl shadow-sm border p-6 md:p-8 ${activeVideos.length > 0 ? 'flex-1 mt-4' : 'mt-0'}`}>
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
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-2xl">
                  ⌛
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Queue is empty</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Paste a YouTube link above to begin generating your next viral reel.
                </p>
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
                      <span className="text-sm font-semibold uppercase tracking-wider text-gray-800">
                        {video.status}
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {video.progress || 0}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {(video.status === "processing" || video.status === "queued") && (
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className={`${video.status === "queued" ? "bg-gray-300 animate-pulse w-full" : "bg-gradient-to-r from-black to-gray-700"} h-3 transition-all duration-500 ease-in-out`}
                          style={{ width: video.status === "queued" ? "100%" : `${video.progress || 0}%` }}
                        />
                      </div>
                    )}

                    {/* Error State */}
                    {video.status === "failed" && (
                      <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-xl text-red-800 text-sm">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">⚠️</span>
                          <div>
                            <p className="font-semibold mb-1">Processing Failed</p>
                            <p className="text-red-600">{video.errorMessage || "An unexpected error occurred."}</p>
                            <button
                              onClick={async () => {
                                await fetch("/api/video/delete", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ videoId: video.id }),
                                })
                                setVideos(prev =>
                                  prev.filter(v => v.id !== video.id)
                                )
                              }}
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
      </div>
    </div>
  )
}
