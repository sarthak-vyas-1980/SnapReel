import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/session"

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { videoId, title } = await req.json()

    if (!videoId || !title) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const video = await prisma.video.findFirst({
      where: { 
        id: videoId,
        userId: user.id
      }
    })

    if (!video) {
      return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 })
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { title },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Rename Video API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}