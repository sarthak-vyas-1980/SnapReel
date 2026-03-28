"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Video = {
  id: string
  youtubeUrl: string
  title?: string | null
  status: string
  progress: number
  thumbnailUrl?: string | null
  reelUrl?: string | null
  errorMessage?: string | null
  createdAt?: string
}

export default function DashboardClient({
  videos: initialVideos,
}: {
  videos: Video[]
}) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>(Array.isArray(initialVideos) ? initialVideos : [])
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/video/status")
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700 border-green-200"
    if (status === "processing" || status === "queued") return "bg-yellow-100 text-yellow-700 border-yellow-200"
    if (status === "failed") return "bg-red-100 text-red-700 border-red-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  const handleRename = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch("/api/video/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        title: newTitle,
      }),
    })

    setVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, title: newTitle } : v))
    )
    setEditingId(null)
  }

  const safeVideos = Array.isArray(videos) ? videos : []
  const filteredVideos = safeVideos.filter(v =>
    (v.title || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-6xl mx-auto px-6 py-12 w-full flex-1">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            🎬 SnapReel Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Turn long YouTube videos into short engaging reels instantly.
          </p>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full bg-gray-50/50 rounded-2xl border flex items-center px-4 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition">
              <span className="text-gray-400 text-lg mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search reels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent py-4 focus:outline-none w-full text-gray-800 placeholder-gray-400"
              />
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-gray-200 h-10 mx-4" />

            {/* Generate Action */}
            <div className="flex shrink-0">
              <Link
                href="/generate"
                className="bg-black text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition whitespace-nowrap font-semibold shadow-md inline-flex items-center gap-2"
              >
                <span className="text-xl leading-none">+</span> Create New Reel
              </Link>
            </div>
          </div>
        </div>

        {/* Videos Area */}
        <div className="mt-12">
          {filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-center bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm mt-8">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-5xl">
                📭
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {search ? "No matches found" : "No reels yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                {search
                  ? `We couldn't find any reels matching "${search}". Try a different term.`
                  : "Create your first reel to get started."}
              </p>
              {!search && (
                <Link
                  href="/generate"
                  className="bg-black text-white px-8 py-4 rounded-2xl hover:opacity-90 transition font-semibold shadow-md flex items-center gap-2"
                >
                  <span className="text-2xl leading-none">+</span> Create First Reel
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => router.push(`/reel/${video.id}`)}
                  className="bg-white rounded-3xl shadow-sm border p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-[250px] relative group overflow-hidden"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gray-100">
                    {video.status === 'processing' && (
                      <div className="h-full bg-blue-500 animate-pulse transition-all" style={{ width: `${video.progress}%` }} />
                    )}
                    {video.status === 'completed' && <div className="h-full bg-green-500 w-full" />}
                    {video.status === 'failed' && <div className="h-full bg-red-500 w-full" />}
                  </div>

                  <div className="flex-1 mt-2">
                    {/* Rename Section inside list view */}
                    {editingId === video.id ? (
                      <div className="flex flex-col gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="border border-gray-300 px-3 py-2 rounded-lg w-full font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black shadow-sm text-sm"
                          placeholder="Reel Title..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleRename(video.id, e)}
                            className="flex-1 bg-black text-white px-3 py-2 rounded-lg font-bold text-xs hover:opacity-90 transition-all shadow-sm"
                          >
                            Save Title
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-white text-gray-700 px-3 py-2 rounded-lg font-bold text-xs border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start mb-4 gap-4">
                        <h3 className="text-xl font-bold text-gray-900 line-clamp-2" title={video.title || "Untitled Reel"}>
                          {video.title || "Untitled Reel"}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(video.id)
                            setNewTitle(video.title || "")
                          }}
                          className="text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 hover:bg-black hover:text-white rounded-md transition opacity-0 group-hover:opacity-100"
                        >
                          Rename
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider border ${statusColor(video.status)}`}>
                        {video.status}
                      </span>
                      {video.createdAt && (
                        <span suppressHydrationWarning className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md border">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-600 group-hover:underline">
                      View Reel →
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                      ↗
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}