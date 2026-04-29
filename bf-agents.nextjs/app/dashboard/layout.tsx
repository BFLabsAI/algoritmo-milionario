// app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()
  
  // MVP: Bypass login check
  if (!user) {
    user = {
      id: 'mock-admin-id',
      email: 'admin@algoritmomilionario.com',
      user_metadata: { full_name: 'Admin MVP' }
    } as any
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar user={user as any} />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  )
}
