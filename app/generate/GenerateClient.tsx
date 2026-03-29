"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import GenerateForm from "../../components/generate/GenerateForm"
import ProcessingQueue from "../../components/generate/ProcessingQueue"

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

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/video/status")
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleDismissError = async (id: string) => {
    await fetch("/api/video/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: id }),
    })
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  const activeVideos = (Array.isArray(videos) ? videos : []).filter(
    (v) => v.status === "processing" || v.status === "queued" || v.status === "failed"
  )

  return (
    <div className="flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col mt-4">
        <GenerateForm />

        <ProcessingQueue activeVideos={activeVideos} onDismissError={handleDismissError} />
      </div>
    </div>
  )
}
