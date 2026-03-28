"use client"

import { useEffect, useState } from "react"

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

export default function DashboardClient({
  videos: initialVideos,
}: {
  videos: Video[]
}) {
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")

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

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700"
    if (status === "processing") return "bg-yellow-100 text-yellow-700"
    if (status === "failed") return "bg-red-100 text-red-700"
    return "bg-gray-100 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold tracking-tight">
            🎬 SnapReel Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Turn long YouTube videos into short engaging reels instantly.
          </p>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center">

            {/* YouTube Input */}
            <div className="flex flex-1 gap-5 w-full">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube link..."
                className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition"
              />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-gray-200 h-10" />

            {/* Search */}
            <input
              type="text"
              placeholder="Search reels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition w-full md:w-96"
            />

          </div>
        </div>

        {/* Videos */}
        <div className="mt-12 space-y-8">
          {(Array.isArray(videos) ? videos : [])
          .filter(v =>
            (v.title || "").toLowerCase().includes(search.toLowerCase())
          )
          .map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-2xl shadow-sm border p-8 transition hover:shadow-md"
            >

              {/* Rename Section */}
              {editingId === video.id ? (
                <div className="flex gap-2 mb-4">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="border px-3 py-2 rounded-lg flex-1"
                  />
                  <button
                    onClick={async () => {
                      await fetch("/api/video/rename", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          videoId: video.id,
                          title: newTitle,
                        }),
                      })

                      setVideos(prev =>
                        prev.map(v =>
                          v.id === video.id ? { ...v, title: newTitle } : v
                        )
                      )

                      setEditingId(null)
                    }}
                    className="bg-black text-white px-4 py-2 rounded-lg"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    {video.title || "Untitled Reel"}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingId(video.id)
                      setNewTitle(video.title || "")
                    }}
                    className="text-sm text-gray-500 hover:text-black"
                  >
                    Rename
                  </button>
                </div>
              )}

              {/* URL + Status */}
              <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
                <p className="text-gray-600 break-all text-sm">
                  {video.youtubeUrl}
                </p>

                <span
                  className={`px-3 py-1 text-sm rounded-full ${statusColor(
                    video.status
                  )}`}
                >
                  {video.status}
                </span>
              </div>

              {/* Progress */}
              {(video.status === "processing" || video.status === "queued") && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden text-center flex items-center">
                    <div
                      className={`${video.status === "queued" ? "bg-gray-400 animate-pulse w-full" : "bg-black"} h-3 transition-all duration-500 ease-in-out`}
                      style={{ width: video.status === "queued" ? "100%" : `${video.progress || 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {video.status === "queued" ? "Waiting in queue..." : `Processing... ${video.progress || 0}%`}
                  </p>
                </div>
              )}

              {/* Error */}
              {video.status === "failed" && video.errorMessage && (
                <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm">
                  {video.errorMessage}
                </div>
              )}

              {/* Media */}
              {(video.thumbnailUrl || video.reelUrl) && (
                <div className="grid md:grid-cols-2 gap-8">

                  {/* Reel */}
                  {video.reelUrl && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-3">
                        Reel
                      </p>
                      <div className="bg-black rounded-xl p-3">
                        <video
                          src={video.reelUrl}
                          controls
                          className="rounded-lg w-full max-h-[350px] object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Thumbnail + Actions */}
                  <div className="space-y-6">
                    {video.thumbnailUrl && (
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-3">
                          Thumbnail
                        </p>
                        <img
                          src={video.thumbnailUrl}
                          alt="Thumbnail"
                          className="rounded-xl shadow-md w-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      {video.reelUrl && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(video.reelUrl!)
                          }}
                          className="px-4 py-2 bg-black text-white rounded-xl hover:opacity-90 transition"
                        >
                          Copy Reel URL
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          if (!confirm("Delete this reel?")) return

                          await fetch("/api/video/delete", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ videoId: video.id }),
                          })

                          setVideos(prev =>
                            prev.filter(v => v.id !== video.id)
                          )
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                      >
                        Delete Reel
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}