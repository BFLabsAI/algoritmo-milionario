'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { IMAGE_MODEL_CATALOG } from '@/lib/image-models'
import { Sparkles, ChevronDown, Check, ExternalLink, Image as ImageIcon } from 'lucide-react'

// ── Model metadata ─────────────────────────────────────────────────────────
const MODEL_META: Record<string, { color: string; bg: string; letter: string; label: string }> = {
  'black-forest-labs/flux.2-pro':            { color: '#f97316', bg: 'rgba(249,115,22,0.15)',  letter: 'F', label: 'Black Forest Labs' },
  'google/gemini-2.5-flash-image':           { color: '#4285f4', bg: 'rgba(66,133,244,0.15)',  letter: 'G', label: 'Google' },
  'sourceful/riverflow-v2-standard-preview': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   letter: 'R', label: 'Sourceful' },
  'bytedance-seed/seedream-4.5':             { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  letter: 'S', label: 'ByteDance' },
  'openai/gpt-5-image-mini':                 { color: '#10a37f', bg: 'rgba(16,163,127,0.15)', letter: 'O', label: 'OpenAI' },
}

function ModelIcon({ slug, size = 32 }: { slug: string; size?: number }) {
  const m = MODEL_META[slug] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', letter: '?', label: '' }
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      background: m.bg, border: `1.5px solid ${m.color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.44, fontWeight: 800, color: m.color,
      flexShrink: 0, letterSpacing: '-0.02em',
      boxShadow: `0 0 12px ${m.color}20`,
    }}>
      {m.letter}
    </div>
  )
}

// ── Generating loader ──────────────────────────────────────────────────────
function AtomLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 36, height: '100%', minHeight: 280,
      padding: '24px 16px',
    }}>
      {/* Orbital element — SVG rings + HTML glass card */}
      <div style={{ position: 'relative', width: 'min(420px, 90vw)', height: 'min(320px, 50vw)', maxWidth: '100%', overflow: 'visible' }}>

        {/* SVG: orbital rings + sparkle nodes */}
        <svg
          width="420" height="320"
          viewBox="-210 -160 420 320"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="rg-blue" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(96,165,250,0.1)" />
              <stop offset="40%"  stopColor="rgba(96,165,250,0.55)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.1)" />
            </linearGradient>
            <linearGradient id="rg-purple" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(167,139,250,0.1)" />
              <stop offset="40%"  stopColor="rgba(167,139,250,0.55)" />
              <stop offset="100%" stopColor="rgba(167,139,250,0.1)" />
            </linearGradient>
            <linearGradient id="rg-green" gradientUnits="userSpaceOnUse" x1="-200" y1="0" x2="200" y2="0">
              <stop offset="0%"   stopColor="rgba(52,211,153,0.1)" />
              <stop offset="40%"  stopColor="rgba(52,211,153,0.45)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.1)" />
            </linearGradient>
          </defs>

          {/* Ring 1 — horizontal, blue, dashed */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#rg-blue)"   strokeWidth="1.5" strokeDasharray="7 9" />
          {/* Ring 2 — 40° tilt, purple */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#rg-purple)" strokeWidth="1.5" transform="rotate(40)" />
          {/* Ring 3 — -40° tilt, green, dashed */}
          <ellipse rx="195" ry="65" fill="none" stroke="url(#rg-green)"  strokeWidth="1.5" strokeDasharray="3 6" transform="rotate(-40)" />

          {/* Sparkle node — top-left (on ring 2) */}
          <g transform="translate(-148, -98)">
            <circle r="15" fill="rgba(139,92,246,0.15)" stroke="rgba(167,139,250,0.55)" strokeWidth="1.5" />
            <path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2Z" fill="#c4b5fd">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Sparkle node — top-right (on ring 3) */}
          <g transform="translate(148, -98)">
            <circle r="15" fill="rgba(52,211,153,0.15)" stroke="rgba(52,211,153,0.55)" strokeWidth="1.5" />
            <path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2Z" fill="#34d399">
              <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="7s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Gear node — bottom-left (on ring 3) */}
          <g transform="translate(-148, 98)">
            <circle r="17" fill="rgba(52,211,153,0.1)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.5" />
            <circle r="7" fill="none" stroke="rgba(52,211,153,0.8)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle r="2.5" fill="#34d399" />
          </g>

          {/* Sparkle node — right (on ring 1) */}
          <g transform="translate(188, 38)">
            <circle r="15" fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.5" />
            <path d="M0,-9 L2,-2 L9,0 L2,2 L0,9 L-2,2 L-9,0 L-2,-2Z" fill="#60a5fa">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite" />
            </path>
          </g>
        </svg>

        {/* Central element — spinning ring halo + glass card */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
          <div style={{ position: 'relative', width: 176, height: 176 }}>

            {/* Spinning conic-gradient ring */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 36,
              background: 'conic-gradient(from 0deg, transparent 0%, #a78bfa 22%, #60a5fa 52%, #34d399 78%, transparent 100%)',
              animation: 'spin 2.4s linear infinite',
            }} />

            {/* Dark separator — creates the ring gap */}
            <div style={{
              position: 'absolute', inset: 4, borderRadius: 32,
              background: 'rgb(12,14,24)',
            }} />

            {/* Glass card */}
            <div style={{
              position: 'absolute', inset: 6, borderRadius: 30,
              background: 'linear-gradient(145deg, rgba(90,100,200,0.26) 0%, rgba(50,55,130,0.36) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.16)',
              boxShadow: '0 0 36px rgba(139,92,246,0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
            }}>
              {/* Image icon — SVG gradient, no emoji */}
              <svg width="86" height="86" viewBox="0 0 88 88" fill="none">
                <defs>
                  <linearGradient id="icon-g" x1="0" y1="0" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                    <stop offset="0%"   stopColor="#60a5fa" />
                    <stop offset="48%"  stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <rect x="9" y="14" width="70" height="60" rx="10" fill="rgba(139,92,246,0.12)" stroke="url(#icon-g)" strokeWidth="2.5" />
                <circle cx="28" cy="30" r="9" fill="url(#icon-g)" opacity="0.92" />
                <path d="M9 74 L31 46 L51 63 L65 47 L79 74Z" fill="url(#icon-g)" opacity="0.78" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
          Gerando sua imagem...
        </p>
        <p style={{ fontSize: 13, color: '#64748b' }}>Isso pode levar alguns segundos</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ImageGenerator() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<string>(IMAGE_MODEL_CATALOG[0].slug)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; url: string } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedModel = IMAGE_MODEL_CATALOG.find(m => m.slug === model)!
  const meta = MODEL_META[model] ?? MODEL_META[IMAGE_MODEL_CATALOG[0].slug]

  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  async function generate() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setResult(null)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/images/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ prompt: prompt.trim(), model }),
    })

    if (!res.ok) {
      setError(await res.text())
    } else {
      const data = await res.json()
      setResult({ id: data.id, url: data.image_url })
      router.refresh()
    }
    setLoading(false)
  }

  const active = Boolean(prompt.trim()) && !loading

  return (
    <div className="generator-shell" style={{
      gap: 0,
      borderRadius: 24,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgb(16,18,32) 0%, rgb(10,12,22) 100%)',
      boxShadow: '0 24px 64px -16px rgba(0,0,0,0.7)',
      marginBottom: 40,
    }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#94a3b8', textTransform: 'uppercase' }}>
            Prompt
          </p>
        </div>

        {/* Textarea */}
        <div style={{ flex: 1, padding: '20px 24px' }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate() }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={'Descreva a imagem que deseja criar...\n\nExemplo: "Uma mulher jovem empreendedora em um café moderno, luz natural, estilo fotográfico editorial"'}
            disabled={loading}
            style={{
              width: '100%', height: '100%', minHeight: 220,
              background: 'transparent',
              border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: 14, lineHeight: 1.7,
              resize: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Model selector */}
        <div style={{ padding: '0 24px 20px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>
            Modelo
          </p>
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: dropdownOpen ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${dropdownOpen ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease', textAlign: 'left',
              }}
            >
              <ModelIcon slug={model} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{selectedModel.display_name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{meta.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.4px', padding: '2px 7px',
                  borderRadius: 999, color: meta.color, border: `1px solid ${meta.color}40`,
                  background: meta.bg,
                }}>
                  {selectedModel.badge}
                </span>
                <ChevronDown size={15} style={{ color: '#64748b', transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, right: 0,
                background: 'rgb(14,16,28)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14, padding: 6, zIndex: 50,
                boxShadow: '0 -16px 40px -8px rgba(0,0,0,0.6)',
                animation: 'slideUpFade 0.15s ease-out',
              }}>
                {IMAGE_MODEL_CATALOG.map(m => {
                  const isActive = m.slug === model
                  const mm = MODEL_META[m.slug]
                  return (
                    <button
                      key={m.slug}
                      onClick={() => { setModel(m.slug); setDropdownOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 10,
                        background: isActive ? `${mm?.color}15` : 'transparent',
                        border: 'none', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <ModelIcon slug={m.slug} size={32} />
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.display_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{MODEL_META[m.slug]?.label}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, letterSpacing: '0.4px', padding: '2px 7px',
                          borderRadius: 999, color: mm?.color, border: `1px solid ${mm?.color}40`,
                          background: mm?.bg,
                        }}>
                          {m.badge}
                        </span>
                        {isActive && <Check size={13} style={{ color: mm?.color }} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Generate button */}
        <div style={{
          padding: '16px 24px 24px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {error && (
            <div style={{
              fontSize: 12, color: '#fca5a5', background: 'rgba(239,68,68,0.08)',
              padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)',
              marginBottom: 12,
            }}>
              ⚠️ {error}
            </div>
          )}
          <button
            onClick={generate}
            disabled={!active}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px 0', borderRadius: 14,
              background: active
                ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                : 'rgba(255,255,255,0.04)',
              border: active ? 'none' : '1px solid rgba(255,255,255,0.06)',
              color: active ? '#fff' : '#475569',
              fontSize: 14, fontWeight: 700, cursor: active ? 'pointer' : 'not-allowed',
              boxShadow: active ? '0 0 28px rgba(139,92,246,0.35)' : 'none',
              transition: 'all 0.2s ease',
              letterSpacing: '0.2px',
            }}
            onMouseEnter={e => { if (active) e.currentTarget.style.boxShadow = '0 0 40px rgba(139,92,246,0.55)' }}
            onMouseLeave={e => { if (active) e.currentTarget.style.boxShadow = '0 0 28px rgba(139,92,246,0.35)' }}
          >
            <Sparkles size={16} strokeWidth={2} />
            {loading ? 'Gerando...' : 'Gerar Imagem'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginTop: 10 }}>
            ⌘ + Enter para gerar
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 60%)',
        minHeight: 320,
      }}>
        {loading ? (
          <AtomLoader />
        ) : result ? (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <Image
              src={result.url}
              alt="Imagem gerada"
              fill
              style={{ objectFit: 'contain', padding: 24 }}
              unoptimized
            />
            <a
              href={`/dashboard/imagens/${result.id}`}
              style={{
                position: 'absolute', bottom: 20, right: 20,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 10,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, color: '#fff', textDecoration: 'none', fontWeight: 500,
              }}
            >
              <ExternalLink size={12} />
              Ver detalhes
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 100, height: 100, borderRadius: 24,
              border: '2px dashed rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42,
              boxShadow: 'inset 0 0 24px rgba(139,92,246,0.06)',
            }}>
              🖼️
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Sua imagem aparecerá aqui</p>
              <p style={{ fontSize: 12, color: '#334155' }}>Descreva o que quer criar e clique em Gerar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
