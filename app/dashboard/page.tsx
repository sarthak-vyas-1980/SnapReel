import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import { getCurrentUser } from "@/lib/session"

export default async function DashboardPage() {
  const user = await getCurrentUser({ includeVideos: true })

  if (!user) {
    redirect("/Signin")
  }

  return (
    <DashboardClient
      videos={user.videos.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      }))}
    />
  )
}

