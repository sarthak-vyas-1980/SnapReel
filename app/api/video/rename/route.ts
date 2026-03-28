import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { videoId, title } = await req.json()

  if (!videoId || !title) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { user: true },
  })

  if (!video || video.user.email !== session.user.email) {
    return NextResponse.json({ error: "Not found or not authorized" }, { status: 403 })
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { title },
  })

  return NextResponse.json({ success: true })
}