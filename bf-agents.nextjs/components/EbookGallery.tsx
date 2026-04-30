'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react'
import Link from 'next/link'

export interface EbookRow {
  id: string
  title: string
  status: string
  created_at: string
  theme?: string
  storage_path?: string | null
  download_url?: string | null
}

const COVER_THEMES = [
  { bg: 'linear-gradient(160deg, #0c261a 0%, #0d492d 100%)', accent: '#34d399' },
  { bg: 'linear-gradient(160deg, #160d2e 0%, #3b0764 100%)', accent: '#a855f7' },
  { bg: 'linear-gradient(160deg, #0c1a26 0%, #0d3349 100%)', accent: '#4cc9f0' },
  { bg: 'linear-gradient(160deg, #1a0f2e 0%, #2d1755 100%)', accent: '#818cf8' },
  { bg: 'linear-gradient(160deg, #1a1005 0%, #3d2c0a 100%)', accent: '#fbbf24' },
  { bg: 'linear-gradient(160deg, #1a0510 0%, #3d0a1e 100%)', accent: '#f472b6' },
]

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Aguardando', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  generating: { label: 'Gerando…',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  done:       { label: 'Concluído', color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  error:      { label: 'Erro',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done')       return <CheckCircle2 size={12} />
  if (status === 'error')      return <AlertCircle  size={12} />
  if (status === 'generating') return <Loader2      size={12} style={{ animation: 'spin 1s linear infinite' }} />
  return <Clock size={12} />
}

function BookCard({ ebook, index }: { ebook: EbookRow; index: number }) {
  const [hovered, setHovered] = useState(false)
  const theme = COVER_THEMES[index % COVER_THEMES.length]
  const s = STATUS_CFG[ebook.status] ?? STATUS_CFG['pending']

  return (
    <Link
      href={`/dashboard/ebooks/${ebook.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16,
        background: 'rgba(10,12,22,0.85)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hovered ? '0 20px 52px rgba(0,0,0,0.55)' : '0 4px 20px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition: 'all 0.22s ease',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ── Cover ── */}
      <div style={{
        aspectRatio: '3/4',
        background: theme.bg,
        position: 'relative',
        overflow: 'hidden',
        padding: '20px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Dot texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.045,
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }} />

        {/* Top glow */}
        <div style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
          width: 160, height: 160, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.accent}28 0%, transparent 70%)`,
          filter: 'blur(20px)', pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5,
            background: 'linear-gradient(135deg, #4cc9f0, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, color: '#fff',
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
          }}>AM</div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Algoritmo Milionário
          </span>
        </div>

        {/* Accent line */}
        <div style={{
          width: 32, height: 2, borderRadius: 1,
          background: `linear-gradient(90deg, ${theme.accent}, transparent)`,
          margin: '14px 0 12px', position: 'relative', zIndex: 1,
        }} />

        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3,
          fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
          position: 'relative', zIndex: 1, flex: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        }}>
          {ebook.title}
        </div>

        {/* Theme + PDF label */}
        <div style={{
          paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1, marginTop: 10,
        }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
            {ebook.theme || '—'}
          </span>
          <span style={{ fontSize: 9, color: theme.accent, fontWeight: 700 }}>PDF</span>
        </div>

        {/* Hover overlay — all cards clickable */}
        {ebook.status === 'done' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6,
            background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(139,92,246,0.18))',
              border: '1px solid rgba(139,92,246,0.45)',
              color: '#a5b4fc', fontSize: 12.5, fontWeight: 600,
              boxShadow: '0 0 24px rgba(59,130,246,0.25)',
              backdropFilter: 'blur(8px)',
            }}>
              Abrir preview
            </span>
          </div>
        )}

        {/* Generating overlay */}
        {(ebook.status === 'generating' || ebook.status === 'pending') && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(59,130,246,0.25)', borderTopColor: '#3b82f6', animation: 'spin 0.85s linear infinite' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.3px' }}>Gerando…</span>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ebook.title}
          </p>
          <p style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>
            {new Date(ebook.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          padding: '3px 9px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
          color: s.color, background: s.bg, border: `1px solid ${s.color}33`,
        }}>
          <StatusIcon status={ebook.status} />
          {s.label}
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
    </Link>
  )
}

export default function EbookGallery({ ebooks }: { ebooks: EbookRow[] }) {
  if (!ebooks.length) return null
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Seus Ebooks
        </h2>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 12, color: '#475569' }}>{ebooks.length} ebook{ebooks.length !== 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 18 }}>
        {ebooks.map((eb, i) => <BookCard key={eb.id} ebook={eb} index={i} />)}
      </div>
    </div>
  )
}
