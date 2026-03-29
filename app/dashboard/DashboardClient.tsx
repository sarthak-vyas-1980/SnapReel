"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import ReelCard from "../../components/dashboard/ReelCard"

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
  const [videos, setVideos] = useState<Video[]>(Array.isArray(initialVideos) ? initialVideos : [])
  const [search, setSearch] = useState("")

  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/video/status")
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRename = async (videoId: string, newTitle: string) => {
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
  }

  const handleRetry = async (videoId: string) => {
    try {
      await fetch("/api/video/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      })
      
      // Optimistic update
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, status: "queued", progress: 0, errorMessage: null } : v
        )
      )
    } catch (err) {
      alert("Failed to retry reel.")
    }
  }

  const safeVideos = Array.isArray(videos) ? videos : []
  const filteredVideos = safeVideos.filter(v => {
    const matchesSearch = (v.title || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = filter === "all" || v.status === filter
    return matchesSearch && matchesStatus
  })

  const filterButtons = [
    { label: "All", value: "all" },
    { label: "Completed", value: "completed" },
    { label: "Processing", value: "processing" },
    { label: "Failed", value: "failed" },
  ]

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

            {/* Filters */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    filter === btn.value
                      ? "bg-white text-black shadow-sm"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
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
                {search || filter !== "all" ? "No matches found" : "No reels yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                {search || filter !== "all"
                  ? `We couldn't find any reels matching your criteria. Try changing filters.`
                  : "Create your first reel to get started."}
              </p>
              {!search && filter === "all" && (
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
                <ReelCard 
                  key={video.id} 
                  video={video} 
                  onRename={handleRename} 
                  onRetry={handleRetry}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}