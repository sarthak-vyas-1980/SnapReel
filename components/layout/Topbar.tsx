"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { NotificationBell } from "./NotificationBell"
import { useTheme } from "./ThemeProvider"

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setImgError(false)
  }, [session?.user?.image])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Generate", href: "/generate" },
  ]

  const isActive = (href: string) => pathname === href

  const isReelPage = pathname.startsWith("/reel/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-300 ${
        isReelPage
          ? "bg-indigo-50 dark:bg-slate-900 shadow-sm border-b border-indigo-100 dark:border-slate-800"
          : isScrolled
          ? "bg-indigo-50/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md border-b border-indigo-100 dark:border-slate-800"
          : "bg-indigo-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-transparent dark:border-slate-800/50"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-2xl">🎬</span>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
            SnapReel
          </span>
        </Link>

        {/* Center: Navigation (Desktop) */}
        <nav className="hidden md:flex items-center bg-white/60 dark:bg-slate-800/60 p-1 rounded-2xl border border-white/80 dark:border-gray-700 shadow-sm">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-white dark:bg-slate-800 text-black dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/generate"
            className="hidden sm:inline-flex items-center bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
          >
            <span className="mr-2 text-base">+</span> Create Reel
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {session?.user && <NotificationBell />}

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold hover:shadow-md transition-all active:scale-95"
            >
              {session?.user?.image && !imgError ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm flex items-center justify-center pt-px break-all w-full leading-tight text-center px-0.5">{session?.user?.name ? session.user.name.split(' ')[0] : "U"}</span>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <>
                <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 mb-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session?.user?.name || "User"}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 p-4 shadow-xl animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  isActive(item.href)
                    ? "bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/generate"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 bg-black dark:bg-white dark:text-black text-white px-4 py-4 rounded-xl text-center font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
            >
              + Create New Reel
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
