"use client"

import { Topbar } from "./Topbar"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the user is typing in an input or textarea, don't trigger the shortcut
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key.toLowerCase() === "g") {
        router.push("/generate")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Topbar />
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>
    </div>
  )
}
