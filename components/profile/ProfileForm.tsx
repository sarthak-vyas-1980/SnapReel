"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"

type ProfileFormProps = {
  initialData: { name: string, number: string }
  onUpdate: (data: { name: string, number: string }) => void
}

export default function ProfileForm({ initialData, onUpdate }: ProfileFormProps) {
  const { update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update profile")
      }

      const updatedUser = await res.json()
      onUpdate(formData)
      
      // Update NextAuth session immediately
      await update({ name: formData.name })

      setMessage({ text: "Profile updated successfully!", type: "success" })
      setTimeout(() => {
        setIsEditing(false);
        setMessage({ text: "", type: "" })
      }, 1500)
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col gap-5 w-full">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">Full Name</p>
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">{initialData.name}</p>
          </div>
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wider">Phone Number</p>
            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">{initialData.number || "Not provided"}</p>
          </div>
        </div>
        <div className="flex justify-center md:justify-start w-full pt-1">
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-black dark:hover:bg-gray-100 transition-all shadow-md active:scale-95 mt-1"
          >
            Edit Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
          <input 
            type="text" 
            required 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition font-medium shadow-sm"
          />
        </div>

        <div>
           <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
             Phone Number <span className="text-gray-400 dark:text-gray-600 font-normal lowercase">(Optional)</span>
           </label>
           <input 
             type="tel" 
             value={formData.number}
             onChange={(e) => setFormData({ ...formData, number: e.target.value })}
             className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition font-medium shadow-sm"
             placeholder="+1 (555) 000-0000"
           />
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'} animate-in fade-in zoom-in-95`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-3">
        <button 
          type="button" 
          onClick={() => {
            setIsEditing(false)
            setFormData(initialData)
            setMessage({ text: "", type: "" })
          }}
          disabled={loading}
          className="flex-1 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 py-2.5 text-sm rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2.5 text-sm rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md active:scale-95"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
