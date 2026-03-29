import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import AppLayout from "@/components/layout/AppLayout"
import ProfileWrapper from "@/components/profile/ProfileWrapper"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/Signin")
  }

  // Fetch fresh user data from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      number: true,
      avatar: true,
      image: true,
      password: true, // Only checking if it exists, not returning the hash to client
    }
  })

  if (!user) {
    redirect("/Signin")
  }

  const hasPassword = !!user.password

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-5">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Profile Settings
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            Manage your personal information and security.
          </p>
        </div>

        <ProfileWrapper 
          user={{
            name: user.name || "",
            email: user.email || "",
            number: user.number || "",
            avatar: user.avatar || user.image || "",
          }} 
          hasPassword={hasPassword} 
        />
      </div>
    </AppLayout>
  )
}
