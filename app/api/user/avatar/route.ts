import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

// Disable NEXT.js body parsing to handle FormData natively
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 })
    }

    // Verify bucket exists, if not attempt to create it
    try {
      await supabase.storage.createBucket("avatars", { public: true })
    } catch (e) {
      // Ignore if it already exists
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}-${uuidv4()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return NextResponse.json({ message: "Failed to upload image" }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    const avatarUrl = publicUrlData.publicUrl

    // Update DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: { 
        avatar: avatarUrl,
        image: avatarUrl // Syncing next-auth default image field as well just in case
      }
    })

    return NextResponse.json({ success: true, avatarUrl })
  } catch (error: any) {
    console.error("Avatar upload exception:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
