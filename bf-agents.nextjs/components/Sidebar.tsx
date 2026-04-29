'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

import { MessagesSquare, ImageIcon } from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { href: '/dashboard/chat', icon: <MessagesSquare size={18} color="currentColor" />, label: 'Chat' },
  { href: '/dashboard/experts', icon: '🤖', label: 'Experts' },
  { href: '/dashboard/imagens', icon: <ImageIcon size={18} color="currentColor" />, label: 'Imagens' },
  { href: '/dashboard/ebooks', icon: '📚', label: 'Ebooks' },
  { href: '/dashboard/prompts', icon: '⚡', label: 'Prompts' },
]

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/dashboard') return null

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
          }}>M</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>Algoritmo</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.2 }}>Milionário</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              fontSize: 14, fontWeight: active ? 600 : 400,
              color: active ? '#fff' : 'var(--text-muted)',
              background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))' : 'transparent',
              border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' } }}
            >
              <span style={{ fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <Link href="/dashboard/configuracoes" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 8,
          textDecoration: 'none', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Plano Gratuito</div>
          </div>
        </Link>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-faint)', fontSize: 13, textAlign: 'left',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)' }}
        >
          ↩ Sair
        </button>
      </div>
    </aside>
  )
}
