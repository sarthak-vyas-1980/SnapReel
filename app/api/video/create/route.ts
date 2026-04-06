import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reelQueue } from "@/lib/queue"
import { requireUser } from "@/lib/session"

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "Missing YouTube URL" },
        { status: 400 }
      )
    }

    const video = await prisma.video.create({
      data: {
        youtubeUrl,
        status: "queued",
        userId: user.id,
        title: `Reel - ${youtubeUrl.slice(-6)}`
      }
    })

    await reelQueue.add("process-video", {
      videoId: video.id
    }, {
      removeOnComplete: true,
      removeOnFail: true,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create Video API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
