'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

import {
  LayoutGrid,
  MessagesSquare,
  Bot,
  ImageIcon,
  BookOpen,
  Zap,
  LogOut,
  Settings,
  CalendarDays,
  Lightbulb,
  ScanSearch,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',                 icon: LayoutGrid,    label: 'Dashboard' },
  { href: '/dashboard/chat',            icon: MessagesSquare, label: 'Chat' },
  { href: '/dashboard/agentes',         icon: Bot,            label: 'Agentes' },
  { href: '/dashboard/imagens',         icon: ImageIcon,      label: 'Gerador de Imagens' },
  { href: '/dashboard/ebooks',          icon: BookOpen,       label: 'Criador de Ebooks' },
  { href: '/dashboard/prompts',         icon: Zap,            label: 'Biblioteca de Prompts' },
  { href: '/dashboard/planejador',      icon: CalendarDays,   label: 'Planejador Social' },
  { href: '/dashboard/criador-produto', icon: Lightbulb,      label: 'Criador de Produtos' },
  { href: '/dashboard/analisador',      icon: ScanSearch,     label: 'Analista de Ofertas'},
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
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        height: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 0% 0%, rgba(59,130,246,0.10) 0%, transparent 55%),
                     radial-gradient(ellipse at 100% 100%, rgba(139,92,246,0.10) 0%, transparent 55%),
                     #08090f`,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Aurora veil — same language as chat / agents pages */}
      <div
        className="aurora-bg"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6, zIndex: 0 }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Brand */}
        <div style={{ padding: '20px 18px 18px' }}>
          <Link
            href="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
          >
            <img
              src="/logo-icon.webp"
              alt="Algoritmo Milionário"
              style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, objectFit: 'contain' }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                  fontSize: 14, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.01em',
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
              >
                Algoritmo Milionário
              </div>
            </div>
          </Link>
        </div>

        <div style={{ height: 1, margin: '0 14px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 10, fontWeight: 700, color: '#64748b',
              letterSpacing: '0.7px', textTransform: 'uppercase',
              padding: '4px 12px 8px',
            }}
          >
            Workspace
          </div>

          {NAV.map(({ href, icon: Icon, label }) => {
            const active =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#fff' : '#94a3b8',
                  background: active
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(139,92,246,0.14) 100%)'
                    : 'transparent',
                  border: active
                    ? '1px solid rgba(139,92,246,0.35)'
                    : '1px solid transparent',
                  boxShadow: active
                    ? '0 0 18px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
                    : 'none',
                  textDecoration: 'none',
                  transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
                }}
                onMouseEnter={e => {
                  if (active) return
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'rgba(255,255,255,0.04)'
                  el.style.color = '#e2e8f0'
                }}
                onMouseLeave={e => {
                  if (active) return
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = '#94a3b8'
                }}
              >
                {/* Active indicator bar */}
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 18,
                      borderRadius: 2,
                      background: 'linear-gradient(180deg, #4cc9f0 0%, #8b5cf6 100%)',
                      boxShadow: '0 0 10px rgba(76,201,240,0.6)',
                    }}
                  />
                )}
                <span
                  style={{
                    width: 22, height: 22,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: active ? '#a5b4fc' : 'currentColor',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} strokeWidth={active ? 2.25 : 2} />
                </span>
                <span style={{ flex: 1 }}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / User */}
        <div style={{ padding: '10px 10px 14px' }}>
          <div style={{ height: 1, margin: '0 4px 10px', background: 'rgba(255,255,255,0.06)' }} />

          <Link
            href="/dashboard/configuracoes"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 12,
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
              transition: 'background 0.18s ease, border-color 0.18s ease',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.05)'
              el.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(255,255,255,0.02)'
              el.style.borderColor = 'rgba(255,255,255,0.06)'
            }}
          >
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'linear-gradient(135deg, #4cc9f0 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(76,201,240,0.25)',
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {name}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Plano Gratuito
              </div>
            </div>
            <Settings size={14} style={{ color: '#64748b', flexShrink: 0 }} />
          </Link>

          <button
            onClick={handleLogout}
            aria-label="Sair"
            style={{
              marginTop: 6,
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              background: 'transparent', border: '1px solid transparent',
              color: '#64748b', fontSize: 12.5, fontWeight: 500,
              textAlign: 'left', cursor: 'pointer',
              transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'rgba(239,68,68,0.08)'
              el.style.color = '#fca5a5'
              el.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = '#64748b'
              el.style.borderColor = 'transparent'
            }}
          >
            <LogOut size={15} strokeWidth={2} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
