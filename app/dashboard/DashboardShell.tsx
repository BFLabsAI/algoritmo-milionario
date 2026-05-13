'use client'
import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Sidebar from '@/components/Sidebar'
import MobileTopBar from '@/components/MobileTopBar'
import DrawerBackdrop from '@/components/DrawerBackdrop'

interface DashboardShellProps {
  user: User
  children: React.ReactNode
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        height: '100dvh',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Drawer backdrop — only visible on mobile when sidebar is open */}
      <DrawerBackdrop isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Sidebar — drawer on mobile, inline on tablet/desktop */}
      <Sidebar
        user={user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Mobile top bar — hidden on md+ via CSS class */}
        <MobileTopBar onMenuOpen={() => setSidebarOpen(true)} />

        <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
