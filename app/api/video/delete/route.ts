import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoId } = await req.json()

  const video = await prisma.video.findUnique({
    where: { id: videoId }
  })

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 })
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
}