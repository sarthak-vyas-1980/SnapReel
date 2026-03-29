import { redirect } from "next/navigation"
import GenerateClient from "./GenerateClient"
import { getCurrentUser } from "@/lib/session"
import AppLayout from "@/components/layout/AppLayout"

export default async function GeneratePage() {
  const user = await getCurrentUser({ includeVideos: true })

  if (!user) {
    redirect("/Signin")
  }

  return (
    <AppLayout>
      <GenerateClient 
        videos={user.videos.map(v => ({
          ...v,
          createdAt: v.createdAt.toISOString()
        }))} 
      />
    </AppLayout>
  )
}
