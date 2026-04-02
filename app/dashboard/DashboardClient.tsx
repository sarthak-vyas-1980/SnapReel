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
    <div className="flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1">
        {/* Control Bar */}
        <div className="bg-white dark:bg-slate-800 p-3 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-7">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 w-full bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border dark:border-gray-700 flex items-center px-4 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white focus-within:border-black dark:focus-within:border-white transition">
              <span className="text-gray-400 text-lg mr-2">🔍</span>
              <input
                type="text"
                placeholder="Search reels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent py-4 focus:outline-none w-full text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              {filterButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                    filter === btn.value
                      ? "bg-white dark:bg-slate-800 text-black dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Videos Area */}
        <div>
          {filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm min-h-[55vh]">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 shadow-inner text-3xl">
                📭
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {search || filter !== "all" ? "No matches found" : "No reels yet"}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6 text-base">
                {search || filter !== "all"
                  ? `We couldn't find any reels matching your criteria. Try changing filters.`
                  : "Create your first reel to get started."}
              </p>
              {!search && filter === "all" && (
                <Link
                  href="/generate"
                  className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl hover:opacity-90 transition font-semibold shadow-md flex items-center gap-2"
                >
                  <span className="text-xl leading-none">+</span> Create First Reel
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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