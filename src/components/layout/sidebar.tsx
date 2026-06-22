"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BookCopy,
  ClipboardCheck,
  FileSpreadsheet,
  BookMarked,
  Heart,
  DollarSign,
  FileText,
  Users2,
  Settings,
  X,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Super Admin", "Principal", "Teacher", "Accountant"] },
  { href: "/students", label: "Students", icon: Users, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/teachers", label: "Teachers", icon: GraduationCap, roles: ["Super Admin", "Principal"] },
  { href: "/classes", label: "Classes", icon: BookOpen, roles: ["Super Admin", "Principal"] },
  { href: "/subjects", label: "Subjects", icon: BookCopy, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/exams", label: "Exams & Results", icon: FileSpreadsheet, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/hifz", label: "Hifz Tracking", icon: BookMarked, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/assessments", label: "Character", icon: Heart, roles: ["Super Admin", "Principal", "Teacher"] },
  { href: "/fees", label: "Fees", icon: DollarSign, roles: ["Super Admin", "Principal", "Accountant"] },
  { href: "/reports", label: "Reports", icon: FileText, roles: ["Super Admin", "Principal"] },
  { href: "/users", label: "Users", icon: Users2, roles: ["Super Admin"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["Super Admin"] },
]

interface SidebarProps {
  className?: string
  open: boolean
  onClose: () => void
}

export function Sidebar({ className, open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role ?? ""
  const [schoolName, setSchoolName] = useState("Ihya'us Sunnah")

  useEffect(() => {
    fetch("/api/settings").then(async (res) => {
      if (!res.ok) return
      const data: { key: string; value: string }[] = await res.json()
      const map = new Map(data.map((s) => [s.key, s.value]))
      const name = map.get("school_name")
      if (name) setSchoolName(name)
    }).catch(() => {})
  }, [])

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole))

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[#1e3a5f]/10 bg-white transition-transform duration-300 ease-in-out dark:border-white/5 dark:bg-[#0f1f33] lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#1e3a5f]/10 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a5f] shadow-md dark:bg-[#7ec8e3]">
            <span className="text-lg font-bold text-white dark:text-[#1e3a5f]" style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', serif" }}>إ</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-[#1e3a5f] dark:text-white" style={{ fontFamily: "'Traditional Arabic', 'Scheherazade New', serif" }}>
              إحياء السنة
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7ec8e3]">
              {schoolName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#1e3a5f]/50 transition-colors hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f] dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#1e3a5f] text-white shadow-sm dark:bg-[#7ec8e3] dark:text-[#1e3a5f]"
                      : "text-[#1e3a5f]/70 hover:bg-[#1e3a5f]/5 hover:text-[#1e3a5f] dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-white dark:text-[#1e3a5f]"
                        : "text-[#7ec8e3] dark:text-[#7ec8e3]",
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {visibleItems.length > 0 && (
        <div className="border-t border-[#1e3a5f]/10 dark:border-white/5">
          <div className="flex items-center justify-center px-4 py-3">
            <svg className="h-8 w-full max-w-[160px]" viewBox="0 0 160 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                <g key={col} transform={`translate(${col * 20}, 0)`}>
                  <polygon points="10,2 18,10 10,18 2,10" stroke="currentColor" strokeWidth="0.4" fill="none" className="text-[#1e3a5f]/20 dark:text-white/15" />
                  <polygon points="10,2 18,10 10,18 2,10" stroke="currentColor" strokeWidth="0.4" fill="none" className="text-[#1e3a5f]/10 dark:text-white/10" transform="rotate(45 10 12)" />
                  <circle cx="10" cy="12" r="1.5" fill="currentColor" className="text-[#7ec8e3]/30 dark:text-[#7ec8e3]/40" />
                </g>
              ))}
            </svg>
          </div>
          <p className="pb-3 text-center text-[10px] text-[#1e3a5f]/40 dark:text-white/30">
            &copy; {new Date().getFullYear()} Ihya&apos;us Sunnah
          </p>
        </div>
      )}
    </aside>
  )
}