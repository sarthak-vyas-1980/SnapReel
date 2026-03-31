"use client"

import { useState } from "react"

export default function PasswordForm({ hasPassword, onSuccess }: { hasPassword: boolean, onSuccess?: () => void }) {
  const [formData, setFormData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" })
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" })
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/user/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: formData.oldPassword, newPassword: formData.newPassword })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to update password")
      }

      setMessage({ text: hasPassword ? "Password updated safely!" : "Password securely set!", type: "success" })
      setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" })
      if (onSuccess) {
        setTimeout(onSuccess, 1500)
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasPassword && (
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Current Password</label>
          <input 
            type="password" 
            required 
            value={formData.oldPassword}
            onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition font-medium text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">New Password</label>
          <input 
            type="password" 
            required 
            value={formData.newPassword}
            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition font-medium text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Confirm New</label>
          <input 
            type="password" 
            required 
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-white outline-none transition font-medium text-sm"
          />
        </div>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'} animate-in fade-in zoom-in-95`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-center md:justify-start w-full pt-1">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full sm:w-auto px-8 bg-gray-900 dark:bg-white text-white dark:text-black py-2.5 rounded-xl text-sm font-bold hover:bg-black dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-md active:scale-95 mt-1"
        >
          {loading ? "Processing..." : hasPassword ? "Update Password" : "Set Password"}
        </button>
      </div>
    </form>
  )
}
