'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ChevronDown, ChevronUp, Check, Palette } from 'lucide-react'
import Link from 'next/link'
import type { EbookRow } from '@/components/EbookGallery'

// ── Constants ────────────────────────────────────────────────────────────────

const TONE_OPTIONS = [
  'Profissional e direto',
  'Motivacional e inspirador',
  'Didático e acessível',
  'Conversacional e amigável',
  'Técnico e aprofundado',
  'Formal e acadêmico',
]

const LANGUAGE_OPTIONS = [
  { value: 'Português do Brasil', label: 'PT-BR' },
  { value: 'English',             label: 'EN'    },
  { value: 'Español',             label: 'ES'    },
]

const TONE_THEME: Record<string, { bg: string; accent: string; glow: string }> = {
  'Profissional e direto':     { bg: 'linear-gradient(160deg, #0c1a26 0%, #0d3349 100%)', accent: '#4cc9f0', glow: 'rgba(76,201,240,0.28)'  },
  'Motivacional e inspirador': { bg: 'linear-gradient(160deg, #1a1005 0%, #3d2c0a 100%)', accent: '#fbbf24', glow: 'rgba(251,191,36,0.28)'  },
  'Didático e acessível':      { bg: 'linear-gradient(160deg, #0c261a 0%, #0d492d 100%)', accent: '#34d399', glow: 'rgba(52,211,153,0.28)'  },
  'Conversacional e amigável': { bg: 'linear-gradient(160deg, #051a1a 0%, #0d3939 100%)', accent: '#2dd4bf', glow: 'rgba(45,212,191,0.28)'  },
  'Técnico e aprofundado':     { bg: 'linear-gradient(160deg, #160d2e 0%, #3b0764 100%)', accent: '#a855f7', glow: 'rgba(168,85,247,0.28)'  },
  'Formal e acadêmico':        { bg: 'linear-gradient(160deg, #0d0d1a 0%, #1a1a3d 100%)', accent: '#818cf8', glow: 'rgba(129,140,248,0.28)' },
}

// ── Book SVG icon (gradient) ─────────────────────────────────────────────────

function BookSvgIcon({ size = 76 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 88 88" fill="none">
      <defs>
        <linearGradient id="book-icon-g" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4cc9f0" />
          <stop offset="48%"  stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <rect x="16" y="8" width="48" height="66" rx="6"
        fill="rgba(76,201,240,0.1)" stroke="url(#book-icon-g)" strokeWidth="2.5" />
      <line x1="28" y1="8"  x2="28"  y2="74" stroke="url(#book-icon-g)" strokeWidth="2" />
      <line x1="34" y1="26" x2="56"  y2="26" stroke="url(#book-icon-g)" strokeWidth="1.8" opacity="0.75" />
      <line x1="34" y1="34" x2="56"  y2="34" stroke="url(#book-icon-g)" strokeWidth="1.8" opacity="0.75" />
      <line x1="34" y1="42" x2="50"  y2="42" stroke="url(#book-icon-g)" strokeWidth="1.8" opacity="0.75" />
      <line x1="34" y1="50" x2="54"  y2="50" stroke="url(#book-icon-g)" strokeWidth="1.8" opacity="0.5"  />
    </svg>
  )
}

// ── BookLoader (AtomLoader equivalent) ───────────────────────────────────────

function BookLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 36, height: '100%', minHeight: 380,
    }}>
      <div style={{ position: 'relative', width: 420, height: 320 }}>

        <svg
          width="420" height="320" viewBox="-210 -160 420 320"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="bl-teal"   gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(76,201,240,0.08)" />
              <stop offset="40%"  stopColor="rgba(76,201,240,0.55)" />
              <stop offset="100%" stopColor="rgba(76,201,240,0.08)" />
            </linearGradient>
            <linearGradient id="bl-purple" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(167,139,250,0.08)" />
              <stop offset="40%"  stopColor="rgba(167,139,250,0.55)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.08)" />
            </linearGradient>
            <linearGradient id="bl-amber"  gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(251,191,36,0.08)" />
              <stop offset="40%"  stopColor="rgba(251,191,36,0.45)" />
              <stop offset="100%" stopColor="rgba(251,191,36,0.08)" />
            </linearGradient>
          </defs>

          {/* Ring 1 — horizontal, teal */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#bl-teal)"   strokeWidth="1.5" />
          {/* Ring 2 — 40° tilt, purple */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#bl-purple)" strokeWidth="1.5" transform="rotate(40)" />
          {/* Ring 3 — -40° tilt, amber, dashed */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#bl-amber)"  strokeWidth="1.5" strokeDasharray="4 7" transform="rotate(-40)" />

          {/* Document node — top-left (orbiting on ring 2) */}
          <g>
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="18s" repeatCount="indefinite" />
            <g transform="translate(-148, -98)">
              <circle r="16" fill="rgba(139,92,246,0.12)" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" />
              <rect x="-6" y="-8" width="12" height="16" rx="2" fill="none" stroke="#c4b5fd" strokeWidth="1.4" />
              <line x1="-3" y1="-3" x2="3" y2="-3" stroke="#c4b5fd" strokeWidth="1.1" />
              <line x1="-3" y1="0"  x2="3" y2="0"  stroke="#c4b5fd" strokeWidth="1.1" />
              <line x1="-3" y1="3"  x2="1" y2="3"  stroke="#c4b5fd" strokeWidth="1.1" />
            </g>
          </g>

          {/* Sparkle node — top-right (ring 3) */}
          <g transform="translate(148, -98)">
            <circle r="15" fill="rgba(76,201,240,0.12)" stroke="rgba(76,201,240,0.5)" strokeWidth="1.5" />
            <path d="M0,-8 L1.6,-1.6 L8,0 L1.6,1.6 L0,8 L-1.6,1.6 L-8,0 L-1.6,-1.6Z" fill="#4cc9f0">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="9s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Gear node — bottom-left (ring 3) */}
          <g transform="translate(-148, 98)">
            <circle r="17" fill="rgba(251,191,36,0.10)" stroke="rgba(251,191,36,0.45)" strokeWidth="1.5" />
            <circle r="7.5" fill="none" stroke="rgba(251,191,36,0.8)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle r="2.5" fill="#fbbf24" />
          </g>

          {/* Book node — right (ring 1) */}
          <g transform="translate(188, 38)">
            <circle r="16" fill="rgba(76,201,240,0.12)" stroke="rgba(76,201,240,0.5)" strokeWidth="1.5" />
            <rect x="-7" y="-9" width="11" height="17" rx="2" fill="none" stroke="#4cc9f0" strokeWidth="1.4" />
            <line x1="-7" y1="-2" x2="4" y2="-2" stroke="#4cc9f0" strokeWidth="1.1" />
            <line x1="-2" y1="-9" x2="-2" y2="8"  stroke="#4cc9f0" strokeWidth="1.1" />
          </g>
        </svg>

        {/* Central spinning ring + glass card */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
          <div style={{ position: 'relative', width: 176, height: 176 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 36,
              background: 'conic-gradient(from 0deg, transparent 0%, #a78bfa 22%, #4cc9f0 52%, #fbbf24 78%, transparent 100%)',
              animation: 'spin 2.4s linear infinite',
            }} />
            <div style={{ position: 'absolute', inset: 4, borderRadius: 32, background: 'rgb(12,14,24)' }} />
            <div style={{
              position: 'absolute', inset: 6, borderRadius: 30,
              background: 'linear-gradient(145deg, rgba(76,201,240,0.22) 0%, rgba(50,30,130,0.36) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 0 36px rgba(76,201,240,0.22), inset 0 1px 0 rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}>
              <BookSvgIcon size={76} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Gerando seu ebook...
        </p>
        <p style={{ fontSize: 13, color: '#64748b' }}>A IA está escrevendo e montando o layout. Pode levar 1–3 minutos.</p>
      </div>
    </div>
  )
}

// ── Live 3D Book Preview ─────────────────────────────────────────────────────

function LiveBookPreview({ title, theme, tone, pageCount }: {
  title: string; theme: string; tone: string; pageCount: number
}) {
  const tg = TONE_THEME[tone] ?? TONE_THEME['Profissional e direto']
  const hasContent = Boolean(title || theme)

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 28, padding: 40,
    }}>
      {/* 3D book wrapper */}
      <div style={{
        position: 'relative',
        animation: 'floatBook 4s ease-in-out infinite',
      }}>
        {/* Drop shadow */}
        <div style={{
          position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: 16, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
          animation: 'floatShadow 4s ease-in-out infinite',
          filter: 'blur(6px)',
        }} />

        {/* 3D perspective container */}
        <div style={{
          transform: 'perspective(900px) rotateY(-14deg) rotateX(3deg)',
          transformStyle: 'preserve-3d',
          position: 'relative',
          width: 200,
        }}>
          {/* Page stack (right edge) */}
          <div style={{
            position: 'absolute', right: -9, top: 3,
            width: 9, height: '97%', borderRadius: '0 4px 4px 0',
            background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, rgba(20,22,36,0.9) 1px, rgba(20,22,36,0.9) 4px)',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.5)',
          }} />

          {/* Cover */}
          <div style={{
            width: 200,
            aspectRatio: '3/4',
            borderRadius: '3px 10px 10px 3px',
            background: tg.bg,
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 40px ${tg.glow}`,
            position: 'relative', overflow: 'hidden',
            padding: '22px 18px 18px',
            display: 'flex', flexDirection: 'column',
            transition: 'background 0.5s ease',
          }}>
            {/* Dot texture */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.04,
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '10px 10px', pointerEvents: 'none',
            }} />

            {/* Glow orb */}
            <div style={{
              position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)',
              width: 220, height: 220, borderRadius: '50%',
              background: `radial-gradient(circle, ${tg.glow} 0%, transparent 70%)`,
              filter: 'blur(20px)', pointerEvents: 'none',
            }} />

            {/* Shine sweep */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
                background: 'linear-gradient(105deg, transparent, rgba(255,255,255,0.07), transparent)',
                animation: 'shineSweep 4s ease-in-out infinite',
              }} />
            </div>

            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1, marginBottom: 'auto' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5,
                background: 'linear-gradient(135deg, #4cc9f0, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 800, color: '#fff',
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              }}>AM</div>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Algoritmo Milionário
              </span>
            </div>

            {/* Accent line */}
            <div style={{
              width: 32, height: 2.5, borderRadius: 2, margin: '13px 0 11px',
              background: `linear-gradient(90deg, ${tg.accent}, transparent)`,
              position: 'relative', zIndex: 1, transition: 'background 0.5s ease',
            }} />

            {/* Title */}
            <div style={{
              fontSize: title ? 14 : 11,
              fontWeight: 800,
              color: title ? '#fff' : 'rgba(255,255,255,0.15)',
              lineHeight: 1.3,
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              position: 'relative', zIndex: 1, flex: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 5,
              WebkitBoxOrient: 'vertical',
              transition: 'color 0.2s',
              fontStyle: title ? 'normal' : 'italic',
            }}>
              {title || 'O título do seu ebook aparecerá aqui…'}
            </div>

            {/* Theme chip */}
            {theme && (
              <div style={{
                display: 'inline-flex', alignSelf: 'flex-start',
                padding: '3px 9px', borderRadius: 9999, marginTop: 10, marginBottom: 10,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.11)',
                fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                position: 'relative', zIndex: 1,
                textTransform: 'uppercase', letterSpacing: '0.4px',
                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {theme}
              </div>
            )}

            {/* Bottom meta */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)',
              position: 'relative', zIndex: 1,
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{pageCount} páginas</span>
              <span style={{ fontSize: 9, color: tg.accent, fontWeight: 700, transition: 'color 0.5s' }}>PDF</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-text */}
      {!hasContent && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
            Preview ao vivo
          </p>
          <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
            Preencha o título e o tema<br />para visualizar sua capa
          </p>
        </div>
      )}
    </div>
  )
}

// ── Success state ─────────────────────────────────────────────────────────────

function SuccessState({ title, tone, ebookId }: { title: string; tone: string; ebookId: string }) {
  const tg = TONE_THEME[tone] ?? TONE_THEME['Profissional e direto']
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, padding: 40,
    }}>
      <div style={{ position: 'relative' }}>
        {/* Success badge */}
        <div style={{
          position: 'absolute', top: -14, right: -14, zIndex: 10,
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: '3px solid rgb(12,14,24)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(34,197,94,0.5)',
          animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <Check size={16} color="#fff" strokeWidth={3} />
        </div>

        <div style={{ transform: 'perspective(900px) rotateY(-14deg) rotateX(3deg)', position: 'relative', width: 180 }}>
          <div style={{
            position: 'absolute', right: -8, top: 3,
            width: 8, height: '97%', borderRadius: '0 4px 4px 0',
            background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 1px, rgba(20,22,36,0.9) 1px, rgba(20,22,36,0.9) 4px)',
          }} />
          <div style={{
            width: 180, aspectRatio: '3/4',
            borderRadius: '3px 10px 10px 3px',
            background: tg.bg,
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 50px ${tg.glow}`,
            position: 'relative', overflow: 'hidden',
            padding: '18px 14px 14px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 'auto', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'linear-gradient(135deg, #4cc9f0, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>AM</div>
            </div>
            <div style={{ width: 28, height: 2, borderRadius: 1, background: `linear-gradient(90deg, ${tg.accent}, transparent)`, margin: '10px 0 8px', position: 'relative', zIndex: 1 }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fff', lineHeight: 1.3, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
              {title}
            </div>
            <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, marginTop: 8 }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>Gerado ✓</span>
              <span style={{ fontSize: 8, color: tg.accent, fontWeight: 700 }}>PDF</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.01em' }}>Ebook gerado com sucesso!</p>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Pronto para ser compartilhado e vendido.</p>
        <Link
          href={`/dashboard/ebooks/${ebookId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 24px', borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(76,201,240,0.2), rgba(139,92,246,0.18))',
            border: '1px solid rgba(139,92,246,0.45)',
            color: '#a5b4fc', fontSize: 13, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 0 24px rgba(76,201,240,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          Ver Ebook
        </Link>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props { onCreated: (record: EbookRow) => void }
interface GalleryImage { id: string; prompt: string; image_url: string }

export default function EbookGenerator({ onCreated }: Props) {
  const supabase = createClient()

  const [title, setTitle]                   = useState('')
  const [description, setDescription]       = useState('')
  const [theme, setTheme]                   = useState('')
  const [pageCount, setPageCount]           = useState<5 | 10>(10)
  const [tone, setTone]                     = useState(TONE_OPTIONS[0])
  const [targetAudience, setTargetAudience] = useState('')
  const [language, setLanguage]             = useState(LANGUAGE_OPTIONS[0].value)

  const [showStylePicker, setShowStylePicker] = useState(false)
  const [galleryImages, setGalleryImages]     = useState<GalleryImage[]>([])
  const [galleryLoading, setGalleryLoading]   = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const [loading, setLoading]                       = useState(false)
  const [error, setError]                           = useState<string | null>(null)
  const [doneResult, setDoneResult]                 = useState<{ title: string; id: string; url: string | null } | null>(null)

  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
  }

  useEffect(() => () => stopPolling(), [])

  async function loadGallery(token: string) {
    setGalleryLoading(true)
    try {
      const res = await fetch('/api/images/gallery', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) setGalleryImages(await res.json() as GalleryImage[])
    } finally { setGalleryLoading(false) }
  }

  async function toggleStylePicker() {
    const next = !showStylePicker
    setShowStylePicker(next)
    if (next && galleryImages.length === 0) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) loadGallery(session.access_token)
    }
  }

  const poll = useCallback(async (id: string, token: string, ebookTitle: string) => {
    try {
      const res = await fetch(`/api/ebooks/${id}/status`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json() as { status: string; gamma_url: string | null; export_url: string | null }

      if (data.status === 'done') {
        stopPolling()
        setLoading(false)
        const resolvedUrl = data.export_url ?? data.gamma_url
        setDoneResult({ title: ebookTitle, id, url: resolvedUrl })
        onCreated({ id, title: ebookTitle, status: 'done', created_at: new Date().toISOString(), storage_path: resolvedUrl })
        return
      }
      if (data.status === 'error') {
        stopPolling()
        setLoading(false)
        setError('A geração falhou. Verifique os dados e tente novamente.')
      }
    } catch { /* keep polling */ }
  }, [onCreated])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setDoneResult(null)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Sessão expirada. Faça login novamente.'); return }
    const token = session.access_token

    setLoading(true)

    const res = await fetch('/api/ebooks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title, description, theme, page_count: pageCount, tone,
        target_audience: targetAudience, language,
        ...(selectedImageId ? { style_image_id: selectedImageId } : {}),
      }),
    })

    if (!res.ok) {
      setLoading(false)
      setError(await res.text().catch(() => 'Erro ao iniciar geração'))
      return
    }

    const { id } = await res.json() as { id: string }
    onCreated({ id, title, status: 'generating', created_at: new Date().toISOString() })

    pollRef.current = setInterval(() => poll(id, token, title), 2000)
    poll(id, token, title)
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '11px 14px', color: '#e2e8f0', fontSize: 13.5,
    outline: 'none', fontFamily: "'Inter','Plus Jakarta Sans',sans-serif",
    boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s',
  }
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'
      e.currentTarget.style.boxShadow   = '0 0 0 3px rgba(139,92,246,0.08)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      e.currentTarget.style.boxShadow   = 'none'
    },
  }
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b', textTransform: 'uppercase',
  }
  const divider = <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0' }} />

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '420px 1fr', gap: 0,
      borderRadius: 24, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgb(16,18,32) 0%, rgb(10,12,22) 100%)',
      boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

          {/* Section: Conteúdo */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
            <p style={sectionLabel}>Conteúdo</p>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Título *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="O Método das 7 Chaves para Multiplicar Renda Online"
                required disabled={loading} style={fieldStyle} {...focusHandlers} />
            </div>
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Descrição *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Qual transformação este ebook proporciona? O que o leitor vai aprender?"
                required disabled={loading} rows={3}
                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }} {...focusHandlers} />
            </div>
          </div>

          {divider}

          {/* Section: Configurações */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
            <p style={sectionLabel}>Configurações</p>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Tema *</label>
                <input value={theme} onChange={e => setTheme(e.target.value)}
                  placeholder="ex: Marketing Digital" required disabled={loading}
                  style={fieldStyle} {...focusHandlers} />
              </div>
              <div>
                <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Público-alvo *</label>
                <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
                  placeholder="ex: Empreendedores" required disabled={loading}
                  style={fieldStyle} {...focusHandlers} />
              </div>
            </div>

            {/* Pages */}
            <div>
              <label style={{ ...sectionLabel, display: 'block', marginBottom: 8 }}>Páginas</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([5, 10] as const).map(n => (
                  <button key={n} type="button" onClick={() => setPageCount(n)} disabled={loading}
                    style={{
                      padding: '8px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", cursor: 'pointer',
                      border: pageCount === n ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      background: pageCount === n ? 'rgba(139,92,246,0.15)' : 'rgba(0,0,0,0.2)',
                      color: pageCount === n ? '#c4b5fd' : '#64748b',
                      boxShadow: pageCount === n ? '0 0 14px rgba(139,92,246,0.15)' : 'none',
                      transition: 'all 0.15s',
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Tom de voz</label>
                <select value={tone} onChange={e => setTone(e.target.value)} disabled={loading} style={fieldStyle} {...focusHandlers}>
                  {TONE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...sectionLabel, display: 'block', marginBottom: 7 }}>Idioma</label>
                <select value={language} onChange={e => setLanguage(e.target.value)} disabled={loading}
                  style={{ ...fieldStyle, width: 'auto', minWidth: 90 }} {...focusHandlers}>
                  {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {divider}

          {/* Section: Style picker */}
          <div>
            <button type="button" onClick={toggleStylePicker} disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px', background: 'transparent', border: 'none',
                color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.8px',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.color = '#94a3b8' }}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Palette size={14} color={selectedImageId ? '#a855f7' : 'currentColor'} />
                Estilo de imagem
                {selectedImageId && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 9999, background: 'rgba(139,92,246,0.18)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>1 selecionada</span>}
              </span>
              {showStylePicker ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showStylePicker && (
              <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 12, color: '#475569', margin: '14px 0', lineHeight: 1.6 }}>
                  Selecione uma imagem gerada para extrair a paleta de cores como referência visual do ebook.
                </p>
                {galleryLoading && <p style={{ fontSize: 12, color: '#64748b' }}>Carregando…</p>}
                {!galleryLoading && galleryImages.length === 0 && (
                  <p style={{ fontSize: 12, color: '#475569' }}>Nenhuma imagem gerada ainda.</p>
                )}
                {galleryImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
                    {galleryImages.map(img => (
                      <button key={img.id} type="button"
                        onClick={() => setSelectedImageId(selectedImageId === img.id ? null : img.id)}
                        style={{
                          padding: 0, aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden',
                          border: selectedImageId === img.id ? '2px solid #a855f7' : '2px solid transparent',
                          cursor: 'pointer', background: 'none', position: 'relative',
                          transition: 'border-color 0.15s',
                          boxShadow: selectedImageId === img.id ? '0 0 14px rgba(168,85,247,0.3)' : 'none',
                        }}
                        title={img.prompt}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} alt={img.prompt} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {selectedImageId === img.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={16} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {divider}

          {/* Error + Generate button */}
          <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <div style={{ fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '14px 0', borderRadius: 14,
                background: loading ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: loading ? '1px solid rgba(255,255,255,0.06)' : 'none',
                color: loading ? '#475569' : '#fff',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 28px rgba(99,102,241,0.35)',
                transition: 'all 0.2s ease',
                letterSpacing: '0.2px',
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 44px rgba(99,102,241,0.55)' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(99,102,241,0.35)' }}
            >
              {loading
                ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.15)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Gerando...</>
                : <><Sparkles size={16} strokeWidth={2} /> Gerar Ebook com IA</>
              }
            </button>
            {!loading && (
              <p style={{ textAlign: 'center', fontSize: 11, color: '#334155' }}>
                Gerado com IA · Layout profissional · PDF
              </p>
            )}
          </div>
        </form>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(76,201,240,0.05) 0%, transparent 60%)',
      }}>
        {loading
          ? <BookLoader />
          : doneResult
            ? <SuccessState title={doneResult.title} tone={tone} ebookId={doneResult.id} />
            : <LiveBookPreview title={title} theme={theme} tone={tone} pageCount={pageCount} />
        }
      </div>
    </div>
  )
}

/* ── Global keyframes (injected once) ──────────────────────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('ebook-gen-styles')) {
  const s = document.createElement('style')
  s.id = 'ebook-gen-styles'
  s.textContent = `
    @keyframes spin        { to { transform: rotate(360deg); } }
    @keyframes floatBook   { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    @keyframes floatShadow { 0%,100% { opacity:0.6; transform:translateX(-50%) scaleX(1);   } 50% { opacity:0.35; transform:translateX(-50%) scaleX(0.78); } }
    @keyframes shineSweep  { 0%,100% { left:-100%; } 60% { left:160%; } }
    @keyframes popIn       { from { transform:scale(0); opacity:0; } to { transform:scale(1); opacity:1; } }
    select option          { background: #1e1e2e; color: #e2e8f0; }
  `
  document.head.appendChild(s)
}
