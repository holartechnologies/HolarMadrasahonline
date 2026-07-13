"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      if (response.status === 401) {
        window.location.href = "/login"
      }
      return response
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [router])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a1628]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
