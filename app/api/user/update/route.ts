import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { name, number } = await req.json()

    if (!name || name.trim() === "") {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Check if phone number is already registered to someone else
    if (number) {
      const existingPhone = await prisma.user.findFirst({
        where: { 
          number: number,
          NOT: { id: session.user.id }
        }
      })
      if (existingPhone) {
         return NextResponse.json({ message: "Phone number already in use" }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        number: number || null
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
