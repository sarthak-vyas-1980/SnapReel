"use client"

import { useState } from "react"

export default function DangerZone() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  const handleDelete = () => {
    if (confirmText !== "DELETE") return;
    alert("Account deleted! (Placeholder endpoint)")
    setIsOpen(false)
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-2 w-full max-w-3xl mx-auto text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <p className="text-xs text-red-600/80 dark:text-red-400 font-medium sm:whitespace-nowrap">
            Permanently delete your account and all associated reels. This action is irreversible.
          </p>
          <button 
            onClick={() => setIsOpen(true)}
            className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white px-5 py-2.5 text-xs rounded-xl font-bold transition shadow-sm active:scale-95 shrink-0 border border-red-200 dark:border-red-900/30"
          >
            Delete Account
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200 border dark:border-gray-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Account</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">
              This action cannot be undone. You will permanently lose your profile strictly, 
              your generated reels, and your entire processing history.
            </p>
            
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-900/20 px-1 py-0.5 rounded border border-red-100 dark:border-red-900/30">DELETE</span> to confirm
              </label>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition font-mono text-center tracking-widest text-lg uppercase text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="DELETE"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText("");
                }}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white rounded-xl font-bold transition duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={confirmText !== "DELETE"}
                className="flex-1 px-4 py-3 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition shadow-sm"
              >
                Confirm Deletion
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
