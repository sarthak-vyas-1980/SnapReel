import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { reelQueue } from "@/lib/queue"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { youtubeUrl } = await req.json()

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "Missing YouTube URL" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
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
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
