import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { requireUser } from "@/lib/session"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const user = await requireUser()

    const { videoId } = await req.json()

    if (!videoId) {
      return NextResponse.json({ error: "Missing Video ID" }, { status: 400 })
    }

    const video = await prisma.video.findFirst({
      where: { 
        id: videoId,
        userId: user.id
      }
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found or not authorized" }, { status: 404 })
    }

    // Delete from Supabase Storage
    await supabase.storage.from("reels").remove([
      `${videoId}.mp4`,
      `${videoId}.jpg`
    ])

    // Delete from DB
    await prisma.video.delete({
      where: { id: videoId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete Video API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}