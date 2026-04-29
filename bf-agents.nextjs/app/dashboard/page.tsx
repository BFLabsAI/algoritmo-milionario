// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import DashboardHero from '@/components/DashboardHero'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'

  return <DashboardHero name={name} />
}
