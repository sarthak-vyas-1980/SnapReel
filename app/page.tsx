import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 relative overflow-hidden">
      
      <div className="absolute top-[-120px] left-[-120px] w-[420px] h-[420px] bg-indigo-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-150px] right-[-120px] w-[420px] h-[420px] bg-purple-400/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          SnapReel
        </h1>

        <p className="mt-6 text-lg text-gray-700 max-w-2xl mx-auto">
          Convert long YouTube videos into short AI-powered reels.
          Smart timestamp detection. Automatic trimming. Instant sharing.
        </p>

        <div className="mt-10 flex justify-center gap-6">
          <Link
            href="/api/auth/signin"
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>

          <a
            href="#features"
            className="px-8 py-3 bg-white/80 backdrop-blur border rounded-xl hover:bg-white transition"
          >
            Learn More
          </a>
        </div>
      </div>

      <div
        id="features"
        className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-8"
      >
        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 text-xl">
              🤖
            </div>
            <h3 className="text-xl font-semibold text-indigo-600">
              AI Timestamps
            </h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            SnapReel analyzes transcripts and selects the most engaging
            30–60 second segment automatically.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-purple-100 text-purple-600 text-xl">
              ⚡
            </div>
            <h3 className="text-xl font-semibold text-purple-600">
              Background Processing
            </h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Powered by a dedicated background worker to process videos
            asynchronously without blocking the user interface.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-md hover:shadow-lg transition">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-pink-100 text-pink-600 text-xl">
              ☁️
            </div>
            <h3 className="text-xl font-semibold text-pink-600">
              Cloud Storage
            </h3>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Generated reels and thumbnails are securely stored using Supabase.
          </p>
        </div>
      </div>

      <footer className="text-center pb-8 text-gray-600 text-sm">
        © 2026 SnapReel
      </footer>
    </div>
  )
}