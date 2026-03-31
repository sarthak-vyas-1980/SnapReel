"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import Loader from "@/components/shared/Loader"
import StatusBadge from "@/components/shared/StatusBadge"
import ReelPlayer from "@/components/reel/ReelPlayer"
import ReelInfoCard from "@/components/reel/ReelInfoCard"
import AIInsightsCard from "@/components/reel/AIInsightsCard"
import SourceVideoCard from "@/components/reel/SourceVideoCard"
import ActionsCard from "@/components/reel/ActionsCard"
import AppLayout from "@/components/layout/AppLayout"

type Clip = {
  url: string
  start: string
  end: string
  label: string
}

type Video = {
  id: string
  youtubeUrl: string
  title?: string | null
  status: string
  progress: number
  thumbnailUrl?: string | null
  reelUrl?: string | null
  clips?: Clip[] | null
  errorMessage?: string | null
  createdAt?: string
  timestamps?: { start: string; end: string } | null
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

  const [isPolling, setIsPolling] = useState(true)
  const [selectedClipIndex, setSelectedClipIndex] = useState(0)

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

  const handleRetry = async () => {
    try {
      await fetch("/api/video/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: id }),
      })
      setVideo(prev => prev ? { ...prev, status: "queued", progress: 0, errorMessage: null } : null)
      setIsPolling(true)
    } catch (err) {
      alert("Failed to retry reel.")
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
      <div className="min-h-screen bg-white dark:bg-[#0f172a] flex items-center justify-center transition-colors">
        <Loader />
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center transition-colors">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Error</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{error || "Reel not found."}</p>
        <Link href="/dashboard" className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 dark:hover:bg-gray-100 transition shadow-md font-bold">
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const parseTime = (time: string | number | undefined) => {
    if (typeof time === "number") return time
    if (!time) return 0
    const parts = time.split(":").map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return 0
  }

  const activeClip = video.clips?.[selectedClipIndex] || {
    url: video.reelUrl,
    start: video.timestamps?.start || "00:00:00",
    end: video.timestamps?.end || "00:01:00",
    label: "Main Reel"
  }

  const startSec = parseTime(activeClip.start)
  const endSec = parseTime(activeClip.end)
  const duration = Math.floor(endSec - startSec)
  
  const totalT = Math.max(endSec + 120, 300)
  const startPct = (startSec / totalT) * 100
  const widthPct = ((endSec - startSec) / totalT) * 100

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Header Navigation & Info */}
        <div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full relative">
              <div className="flex items-center gap-3">
                {isRenaming ? (
                   <input
                     autoFocus
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                     onBlur={handleRenameSave}
                     onKeyDown={handleKeyDown}
                     className="text-3xl font-extrabold text-gray-900 dark:text-white border-b-2 border-black dark:border-white focus:outline-none bg-transparent w-full max-w-md py-1"
                   />
                ) : (
                  <h1 
                    className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 cursor-text group"
                    onClick={() => { setIsRenaming(true); setNewTitle(video.title || ""); }}
                    title="Click to rename"
                  >
                    {video.title || "Untitled Reel"}
                    <button className="text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-black dark:hover:text-white transition-all text-xl focus:opacity-100">
                      ✏️
                    </button>
                  </h1>
                )}
              </div>
              <p suppressHydrationWarning className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Generated from YouTube Link
              </p>
            </div>
            
            <StatusBadge status={video.status} progress={video.progress} />
          </div>
        </div>

        {video.status === "failed" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-800 dark:text-red-300 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1 flex items-center gap-2">⚠️ Processing Failed</h3>
              <p className="text-sm opacity-90">{video.errorMessage || "An unexpected error occurred during generation. Please try again or create a new reel."}</p>
            </div>
            <button 
              onClick={handleRetry}
              className="bg-red-600 dark:bg-red-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 dark:hover:bg-red-800 transition shadow-md active:scale-95 whitespace-nowrap"
            >
              🔄 Retry Generation
            </button>
          </div>
        )}

        {/* Unified Layout Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
          <div className="flex flex-col lg:flex-row items-stretch gap-6">
            
            <div className="flex-1 flex flex-col gap-4">
              <ReelPlayer reelUrl={activeClip.url} status={video.status} />
              
              {video.status === "completed" && video.clips && video.clips.length > 0 && (
                <div className="flex bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 overflow-x-auto no-scrollbar border dark:border-gray-700">
                  {video.clips.map((clip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedClipIndex(idx)}
                      className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all ${
                        selectedClipIndex === idx
                          ? "bg-black dark:bg-white text-white dark:text-black shadow-md scale-[1.02]"
                          : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      {clip.label || `Clip ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Details Panel */}
            <div className="lg:w-[400px] flex flex-col justify-between">
              <div className="space-y-4">
                
                <ReelInfoCard 
                  status={video.status}
                  duration={duration}
                  createdAt={video.createdAt}
                  timestamps={{ start: startSec, end: endSec }}
                  startPct={startPct}
                  widthPct={widthPct}
                />

                <AIInsightsCard hookScore={selectedClipIndex === 0 ? 92 : selectedClipIndex === 1 ? 88 : 85} engagementLevel="High" />

                <SourceVideoCard youtubeUrl={video.youtubeUrl} />

                <ActionsCard 
                  reelUrl={activeClip.url} 
                  onDelete={handleDelete} 
                  isDeleting={isDeleting} 
                />

              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
