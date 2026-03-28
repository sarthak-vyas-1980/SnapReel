import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const video = await prisma.video.findFirst({
        where: { id, user: { email: session.user.email } }
      })
      if (!video) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return NextResponse.json(video)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        videos: {
          orderBy: { createdAt: "desc" }
        }
      }
    })

    return NextResponse.json(user?.videos || [])
  } catch (error) {
    console.error("Status API Error:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
