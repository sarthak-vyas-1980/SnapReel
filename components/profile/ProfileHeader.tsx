"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"

export default function ProfileHeader({ name, email, avatar, onAvatarUpdate }: { name: string, email: string, avatar: string, onAvatarUpdate: (url: string) => void }) {
  const { update } = useSession()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })
      
      if (!res.ok) throw new Error("Upload failed")
      
      const data = await res.json()
      onAvatarUpdate(data.avatarUrl)
      
      // Sync Topbar immediately
      await update({ avatar: data.avatarUrl })
    } catch (err: any) {
      alert(err.message || "Failed to upload avatar")
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-row items-center justify-center text-left gap-5">
      <div className="relative group w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-500 flex justify-center items-center cursor-pointer">
        {loading ? (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mb-1"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <span className="text-white text-xs font-bold text-center px-2">Change<br/>Photo</span>
          </div>
        )}

        {avatar && !loading ? (
          <img src={avatar} alt={name || "User Avatar"} className="w-full h-full object-cover relative z-10" />
        ) : !loading ? (
          <span className="text-3xl text-white font-bold relative z-10">{name?.[0]?.toUpperCase() || "U"}</span>
        ) : null}

        <input 
          type="file" 
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 disabled:cursor-not-allowed"
          title="Change profile photo"
        />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{name || "SnapReel User"}</h2>
        <p className="text-sm text-gray-500 font-medium">{email}</p>
      </div>
    </div>
  )
}
