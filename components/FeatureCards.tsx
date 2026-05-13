'use client'
import Link from 'next/link'
import { MessageSquare, Bot, ImageIcon, BookOpen, Zap } from 'lucide-react'

const FEATURES = [
  { href: '/dashboard/chat',    Icon: MessageSquare, label: 'Chat IA',  desc: 'Converse com modelos avançados', neon: '#4cc9f0' },
  { href: '/dashboard/experts', Icon: Bot,           label: 'Experts',  desc: 'Agentes especialistas',         neon: '#b5179e' },
  { href: '/dashboard/imagens', Icon: ImageIcon,     label: 'Imagens',  desc: 'Geração de visuais',            neon: '#4cc9f0' },
  { href: '/dashboard/ebooks',  Icon: BookOpen,      label: 'Ebooks',   desc: 'Cursos e livros digitais',      neon: '#b5179e' },
  { href: '/dashboard/prompts', Icon: Zap,           label: 'Prompts',  desc: 'Biblioteca estratégica',        neon: '#4cc9f0' },
]

const glassCard: React.CSSProperties = {
  background: 'rgba(25, 30, 45, 0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  borderRadius: 24,
}

export default function FeatureCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 20 }}>
      {FEATURES.map(({ href, Icon, label, desc, neon }) => (
        <Link key={href} href={href} style={{ textDecoration: 'none', color: '#fff' }}>
          <div
            style={{ ...glassCard, padding: '28px 16px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.25s ease, box-shadow 0.25s ease', position: 'relative' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-8px)'
              el.style.boxShadow = `0 8px 40px rgba(0,0,0,0.6), 0 0 20px ${neon}40`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(0)'
              el.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)'
            }}
          >
            {/* Neon border glow */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: -2, borderRadius: 26, zIndex: -1,
              background: `linear-gradient(45deg, ${neon}, ${neon === '#4cc9f0' ? '#b5179e' : '#4cc9f0'})`,
              opacity: 0.35, filter: 'blur(6px)',
            }} />
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
              background: `${neon}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${neon}30`,
            }}>
              <Icon size={26} color={neon} strokeWidth={1.5} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280', lineHeight: 1.5 }}>{desc}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
