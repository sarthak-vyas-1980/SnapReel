import { redirect } from "next/navigation"
import GenerateClient from "./GenerateClient"
import { getCurrentUser } from "@/lib/session"

export default async function GeneratePage() {
  const user = await getCurrentUser({ includeVideos: true })

  if (!user) {
    redirect("/Signin")
  }

  return (
    <GenerateClient 
      videos={user.videos.map(v => ({
        ...v,
        createdAt: v.createdAt.toISOString()
      }))} 
    />
  )
}
