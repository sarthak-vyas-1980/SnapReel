"use client"

import { useState, useEffect, useRef } from "react"

interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error"
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [toast, setToast] = useState<Notification | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const prevNotificationsRef = useRef<Notification[]>([])

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        
        // Check for new notifications to show toast
        if (prevNotificationsRef.current.length > 0) {
          const newNotifs = data.filter(
            (n: Notification) => !prevNotificationsRef.current.some(pn => pn.id === n.id)
          )
          if (newNotifs.length > 0) {
            setToast(newNotifs[0])
            setTimeout(() => setToast(null), 5000)
          }
        }
        
        setNotifications(data)
        const unread = data.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
        prevNotificationsRef.current = data
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    }
  }

  const markAsRead = async () => {
    if (unreadCount === 0) return
    try {
      await fetch("/api/notifications/read", { method: "POST" })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleToggle = () => {
    if (!isOpen) {
      markAsRead()
    }
    setIsOpen(!isOpen)
  }

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon & Badge */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                    !n.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap">
                      {getTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-snug">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Simple Toast */}
      {toast && (
        <div 
          className="fixed bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-2xl rounded-2xl p-4 pr-6 min-w-[300px] animate-in slide-in-from-right duration-500 z-[100]"
          onClick={() => setToast(null)}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            toast.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          }`}>
            {toast.type === "success" ? "✓" : "!"}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{toast.title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{toast.message}</p>
          </div>
          <button className="ml-auto text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400">×</button>
        </div>
      )}
    </div>
  )
}
