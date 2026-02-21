import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { videoId, title } = await req.json()

  if (!videoId || !title) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 })
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { title },
  })

  return NextResponse.json({ success: true })
}