import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { oldPassword, newPassword } = await req.json()

    if (!newPassword) {
      return NextResponse.json({ message: "New password is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Verify old password only if one currently exists
    if (user.password) {
      if (!oldPassword) {
        return NextResponse.json({ message: "Current password is required" }, { status: 400 })
      }
      const valid = await bcrypt.compare(oldPassword, user.password)
      if (!valid) {
        return NextResponse.json({ message: "Incorrect current password" }, { status: 400 })
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({ success: true, message: user.password ? "Password updated successfully" : "Password created successfully" })
  } catch (error: any) {
    console.error("Password update error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
