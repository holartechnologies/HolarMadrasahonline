"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Menu, Search, Moon, Sun, LogOut, User, Settings as SettingsIcon, Users, GraduationCap, BookOpen, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SearchResult {
  id: string
  type: "student" | "teacher" | "class"
  label: string
  subtitle: string
  href: string
}

interface NavbarProps {
  className?: string
  onMenuToggle: () => void
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"
}

export function Navbar({ className, onMenuToggle }: NavbarProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const stored = localStorage.getItem("darkMode")
    const isDark = stored !== null ? stored === "true" : document.documentElement.classList.contains("dark")
    setDarkMode(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    setSearching(true)
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        fetch(`/api/students?search=${encodeURIComponent(q)}`).catch(() => null),
        fetch(`/api/teachers`).catch(() => null),
        fetch(`/api/classes`).catch(() => null),
      ])

      const results: SearchResult[] = []

      if (studentsRes?.ok) {
        const students = await studentsRes.json()
        const data = Array.isArray(students) ? students : []
        data.slice(0, 5).forEach((s: { id: string; firstName: string; lastName: string; admissionNumber: string }) => {
          results.push({
            id: s.id,
            type: "student",
            label: `${s.firstName} ${s.lastName}`,
            subtitle: `Admission: ${s.admissionNumber}`,
            href: `/students/${s.id}`,
          })
        })
      }

      if (teachersRes?.ok) {
        const teachers = await teachersRes.json()
        const data = Array.isArray(teachers) ? teachers : []
        data.slice(0, 3).forEach((t: { id: string; fullName: string; staffId: string }) => {
          if (t.fullName.toLowerCase().includes(q.toLowerCase())) {
            results.push({
              id: t.id,
              type: "teacher",
              label: t.fullName,
              subtitle: `Staff: ${t.staffId}`,
              href: `/teachers/${t.id}`,
            })
          }
        })
      }

      if (classesRes?.ok) {
        const classes = await classesRes.json()
        const data = Array.isArray(classes) ? classes : []
        data.slice(0, 3).forEach((c: { id: string; name: string; code: string }) => {
          if (c.name.toLowerCase().includes(q.toLowerCase()) || c.code.toLowerCase().includes(q.toLowerCase())) {
            results.push({
              id: c.id,
              type: "class",
              label: c.name,
              subtitle: `Code: ${c.code}`,
              href: `/classes/${c.id}`,
            })
          }
        })
      }

      setSearchResults(results.slice(0, 8))
      setShowResults(results.length > 0)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  function handleSearchChange(value: string) {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  function handleSelect(href: string) {
    setShowResults(false)
    setSearchQuery("")
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const toggleDarkMode = () => {
    const isDark = !darkMode
    setDarkMode(isDark)
    document.documentElement.classList.toggle("dark", isDark)
    localStorage.setItem("darkMode", String(isDark))
  }

  const [schoolName, setSchoolName] = useState("Holartech MadrasahPro")
  const initials = user?.name ? getInitials(user.name) : "U"

  useEffect(() => {
    fetch("/api/settings").then(async (res) => {
      if (!res.ok) return
      const data: { key: string; value: string }[] = await res.json()
      const map = new Map(data.map((s) => [s.key, s.value]))
      const name = map.get("school_name")
      if (name) setSchoolName(name)
    }).catch(() => {})
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[#1e3a5f]/10 bg-white/80 px-4 backdrop-blur-md dark:border-white/5 dark:bg-[#0f1f33]/80 sm:px-6",
        className,
      )}
    >
      <button
        onClick={onMenuToggle}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1e3a5f] transition-colors hover:bg-[#1e3a5f]/10 dark:text-white dark:hover:bg-white/10 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden items-center gap-2.5 sm:flex">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1e3a5f] dark:bg-[#7ec8e3]">
          <span className="text-xs font-bold text-white dark:text-[#1e3a5f]">إ</span>
        </div>
        <span className="text-sm font-semibold text-[#1e3a5f] dark:text-white">
          {schoolName}
        </span>
      </div>

      <div className="flex-1" />

      <div ref={searchRef} className="relative hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1e3a5f]/40 dark:text-white/40" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
          onKeyDown={handleKeyDown}
          placeholder="Search students, teachers..."
          className="h-9 w-full rounded-lg border border-[#1e3a5f]/10 bg-[#1e3a5f]/5 pl-9 pr-4 text-sm text-[#1e3a5f] placeholder:text-[#1e3a5f]/30 outline-none transition-all focus:border-[#7ec8e3] focus:ring-1 focus:ring-[#7ec8e3] dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1e3a5f]/40 hover:text-[#1e3a5f] dark:text-white/40 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {showResults && (
          <div className="absolute top-full mt-1 w-full rounded-lg border border-[#1e3a5f]/10 bg-white shadow-lg dark:border-white/10 dark:bg-[#0f1f33]">
            {searching && (
              <div className="px-3 py-2 text-xs text-[#1e3a5f]/50 dark:text-white/50">Searching...</div>
            )}
            {!searching && searchResults.length === 0 && searchQuery && (
              <div className="px-3 py-2 text-xs text-[#1e3a5f]/50 dark:text-white/50">No results found</div>
            )}
            {searchResults.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r.href)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[#1e3a5f]/5 dark:hover:bg-white/5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#7ec8e3]/20">
                  {r.type === "student" ? <Users className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-[#7ec8e3]" /> :
                   r.type === "teacher" ? <GraduationCap className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-[#7ec8e3]" /> :
                   <BookOpen className="h-3.5 w-3.5 text-[#1e3a5f] dark:text-[#7ec8e3]" />}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-[#1e3a5f] dark:text-white">{r.label}</p>
                  <p className="text-xs text-[#1e3a5f]/50 dark:text-white/50">{r.subtitle}</p>
                </div>
                <span className="text-[10px] uppercase text-[#1e3a5f]/30 dark:text-white/30">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={toggleDarkMode}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1e3a5f] transition-colors hover:bg-[#1e3a5f]/10 dark:text-white dark:hover:bg-white/10"
        aria-label="Toggle theme"
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-lg p-1 text-[#1e3a5f] transition-colors hover:bg-[#1e3a5f]/10 dark:text-white dark:hover:bg-white/10">
            <Avatar className="h-8 w-8 border-2 border-[#7ec8e3]">
              <AvatarFallback className="bg-[#1e3a5f] text-xs font-bold text-white dark:bg-[#7ec8e3] dark:text-[#1e3a5f]">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-[#1e3a5f] dark:text-white">
            {user?.name ?? "User"}
            {user?.username && (
              <p className="text-xs font-normal text-[#1e3a5f]/60 dark:text-white/60">
                @{user.username}
              </p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut()}
            className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}