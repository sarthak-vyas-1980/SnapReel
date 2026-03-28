"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

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
  timestamps?: { start: number; end: number } | null
}

export default function ReelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    if (!id) return

    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/video/status?id=${id}`)
        if (!res.ok) {
          setError(res.status === 404 ? "Reel not found." : "Failed to fetch reel.")
          setLoading(false)
          return
        }
        const data = await res.json()
        setVideo(data)
        setLoading(false)
      } catch (err) {
        setError("An unexpected error occurred.")
        setLoading(false)
      }
    }

    fetchVideo()

    const interval = setInterval(() => {
      setIsPolling(prev => {
         if(prev) fetchVideo();
         return prev;
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [id])

  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (video && (video.status === 'completed' || video.status === 'failed')) {
      setIsPolling(false)
    } else {
      setIsPolling(true)
    }
  }, [video?.status])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this reel?")) return
    setIsDeleting(true)
    try {
      await fetch("/api/video/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      })
      router.push("/dashboard")
    } catch (err) {
      alert("Failed to delete reel.")
      setIsDeleting(false)
    }
  }

  const handleRenameSave = async () => {
    if (!newTitle.trim() || newTitle === video?.title) {
      setIsRenaming(false)
      setNewTitle(video?.title || "")
      return
    }
    try {
      await fetch("/api/video/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id, title: newTitle }),
      })
      setVideo(prev => prev ? { ...prev, title: newTitle } : null)
      setIsRenaming(false)
    } catch (err) {
      alert("Failed to rename reel.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRenameSave()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewTitle(video?.title || "")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 mb-8">{error || "Reel not found."}</p>
        <Link href="/dashboard" className="px-6 py-2 bg-black text-white rounded-xl hover:opacity-90 transition shadow-md">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const statusColor = (status: string) => {
    if (status === "completed") return "bg-green-100 text-green-700 border-green-200"
    if (status === "processing" || status === "queued") return "bg-yellow-100 text-yellow-700 border-yellow-200"
    if (status === "failed") return "bg-red-100 text-red-700 border-red-200"
    return "bg-gray-100 text-gray-700 border-gray-200"
  }

  const startT = video.timestamps?.start || 0;
  const endT = video.timestamps?.end || startT + 60;
  const paddingT = 120;
  const totalT = Math.max(endT + paddingT, 300);
  const startPct = (startT / totalT) * 100;
  const widthPct = ((endT - startT) / totalT) * 100;

  const duration = video.timestamps ? Math.floor(video.timestamps.end - video.timestamps.start) : 35;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-6 font-sans">
      <div className="w-full max-w-7xl flex flex-col gap-6">
        
        {/* Header Navigation & Info */}
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-black hover:underline transition mb-6">
            ← Back to Dashboard
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full relative">
              <div className="flex items-center gap-3">
                {isRenaming ? (
                   <input
                     autoFocus
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                     onBlur={handleRenameSave}
                     onKeyDown={handleKeyDown}
                     className="text-3xl font-extrabold text-gray-900 border-b-2 border-black focus:outline-none bg-transparent w-full max-w-md py-1"
                   />
                ) : (
                  <h1 
                    className="text-3xl font-extrabold text-gray-900 flex items-center gap-3 cursor-text group"
                    onClick={() => { setIsRenaming(true); setNewTitle(video.title || ""); }}
                    title="Click to rename"
                  >
                    {video.title || "Untitled Reel"}
                    <button className="text-gray-300 opacity-0 group-hover:opacity-100 hover:text-black transition-all text-xl focus:opacity-100">
                      ✏️
                    </button>
                  </h1>
                )}
              </div>
              <p suppressHydrationWarning className="text-sm text-gray-500 mt-1">
                Generated from YouTube Link
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 py-2 px-4 rounded-xl border border-gray-200 flex-shrink-0">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColor(video.status)} uppercase tracking-wider`}>
                {video.status}
              </span>
              {isPolling && (
                <span className="flex h-3 w-3 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
              <span className="text-sm font-bold text-gray-700 font-mono">
                {video.progress}%
              </span>
            </div>
          </div>
        </div>

        {video.status === "failed" && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-lg mb-2 flex items-center gap-2">⚠️ Processing Failed</h3>
            <p>{video.errorMessage || "An unexpected error occurred during generation. Please try again or create a new reel."}</p>
          </div>
        )}

        {/* Unified Layout Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            
            {/* LEFT: Video Player */}
            <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden min-h-[400px]">
              {video.reelUrl ? (
                <video
                  src={video.reelUrl}
                  controls
                  className="w-full h-full max-h-[600px] object-contain rounded-xl"
                />
              ) : video.status === "processing" || video.status === "queued" ? (
                <div className="text-center p-12 text-white flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-gray-600 border-t-white rounded-full animate-spin mb-6" />
                  <p className="text-xl font-bold mb-2">Analyzing & Editing...</p>
                  <p className="text-gray-400 font-medium">Sit tight! We are capturing the best moment.</p>
                </div>
              ) : (
                <div className="text-center p-12 text-gray-500 flex flex-col items-center">
                  <span className="text-6xl block mb-6 opacity-30">🎬</span>
                  <p className="text-xl font-bold">No media available.</p>
                </div>
              )}
            </div>

            {/* RIGHT: Details Panel */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Card 1: Reel & Clip Info */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <p className="text-sm font-bold text-gray-900 capitalize">{video.status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</p>
                      <p className="text-sm font-bold text-gray-900">{duration} sec</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                    <p suppressHydrationWarning className="text-sm font-bold text-gray-900">{video.createdAt ? new Date(video.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Clip Selection</p>
                    {video.timestamps ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 w-[45%] shadow-sm">
                            <p className="font-mono text-sm font-bold text-gray-900">
                              {Math.floor(video.timestamps.start / 60)}:{String(Math.floor(video.timestamps.start % 60)).padStart(2, '0')}
                            </p>
                          </div>
                          <span className="text-gray-400 font-bold text-sm">→</span>
                          <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 w-[45%] shadow-sm">
                            <p className="font-mono text-sm font-bold text-gray-900">
                              {Math.floor(video.timestamps.end / 60)}:{String(Math.floor(video.timestamps.end % 60)).padStart(2, '0')}
                            </p>
                          </div>
                        </div>

                        <div className="w-full">
                          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden border shadow-inner">
                            <div 
                              className="absolute h-full bg-black rounded-full shadow-sm"
                              style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Clip data unavailable</p>
                    )}
                  </div>
                </div>

                {/* Card 2: AI Insights */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl flex flex-col justify-center items-center text-white shadow-sm overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🎯</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 z-10">Hook Score</p>
                    <p className="text-4xl font-black z-10 tracking-tight">92<span className="text-sm opacity-60 font-medium ml-1">/100</span></p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-4 rounded-xl flex flex-col justify-center items-center text-white shadow-sm overflow-hidden relative group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🔥</div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 z-10">Engagement Level</p>
                    <p className="text-2xl font-black z-10 tracking-tight mt-1">High</p>
                  </div>
                </div>

                {/* Card 3: Source Video */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Source Video</h3>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
                        ▶
                      </div>
                      <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 truncate hover:text-red-600 hover:underline transition-all flex-1">
                        {video.youtubeUrl}
                      </a>
                    </div>
                    <a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="w-full text-center py-2.5 bg-white text-gray-700 font-bold text-sm rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 justify-center">
                      <span>↗️</span> Open Original
                    </a>
                  </div>
                </div>

                {/* Actions (Prominent) */}
                <div className="pt-2">
                  <div className="space-y-3">
                    <a
                      href={video.reelUrl || "#"}
                      download
                      className={`w-full flex items-center justify-center gap-2 py-3 bg-black text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-md transition-all ${!video.reelUrl ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      ⬇️ Download Reel
                    </a>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (video.reelUrl) {
                            navigator.clipboard.writeText(video.reelUrl)
                            alert("URL copied to clipboard!")
                          }
                        }}
                        disabled={!video.reelUrl}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-gray-900 border-2 border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                      >
                        🔗 Copy URL
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 border border-red-100 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
