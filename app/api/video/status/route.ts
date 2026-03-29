import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { requireUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const user = await requireUser()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const video = await prisma.video.findFirst({
        where: { 
          id, 
          userId: user.id 
        }
      })
      if (!video) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return NextResponse.json(video)
    }

    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(videos)
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Status API Error:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
