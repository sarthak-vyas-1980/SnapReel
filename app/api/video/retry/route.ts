import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { reelQueue } from "@/lib/queue"
import { requireUser } from "@/lib/session"

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing Video ID" },
        { status: 400 }
      )
    }

    const video = await prisma.video.findFirst({
      where: { 
        id: videoId,
        userId: user.id
      }
    })

    if (!video) {
      return NextResponse.json(
        { error: "Video not found or unauthorized" },
        { status: 404 }
      )
    }

    // Reset video status and re-queue
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "queued",
        progress: 0,
        errorMessage: null,
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
    console.error("Retry Video API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
