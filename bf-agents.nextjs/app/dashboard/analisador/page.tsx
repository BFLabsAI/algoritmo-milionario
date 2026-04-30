'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, ScanSearch } from 'lucide-react'
import type {
  GenerateOfferAnalysisOutput,
  OfferScores,
  OfferXray,
  ModelingSuggestion,
} from '@/lib/ai-generators'

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisSummary = {
  id: string
  source_url: string | null
  preview: string | null
  created_at: string
}

type AnalysisFull = {
  id: string
  source_url: string | null
  source_text: string
  analysis: GenerateOfferAnalysisOutput
  created_at: string
}

type PageState = 'input' | 'analyzing' | 'result'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SCORE_LABELS: Record<keyof OfferScores, string> = {
  hook_strength: 'Força do Hook',
  clarity_of_problem: 'Clareza do Problema',
  unique_mechanism: 'Mecanismo Único',
  offer_stack_value: 'Stack de Valor',
  social_proof: 'Prova Social',
  guarantee_strength: 'Força da Garantia',
  cta_effectiveness: 'Eficácia do CTA',
  urgency_scarcity: 'Urgência / Escassez',
}

function getScoreColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#f59e0b'
  return '#ef4444'
}

function getScoreBg(score: number): string {
  if (score >= 8) return 'rgba(16,185,129,0.12)'
  if (score >= 6) return 'rgba(245,158,11,0.12)'
  return 'rgba(239,68,68,0.12)'
}

function getScoreBorder(score: number): string {
  if (score >= 8) return 'rgba(16,185,129,0.25)'
  if (score >= 6) return 'rgba(245,158,11,0.25)'
  return 'rgba(239,68,68,0.25)'
}

function getPriorityStyle(priority: 'alta' | 'média' | 'baixa') {
  if (priority === 'alta') return { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.3)', label: 'Alta' }
  if (priority === 'média') return { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.3)', label: 'Média' }
  return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)', label: 'Baixa' }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function calcOverallScore(scores: OfferScores): number {
  const keys = Object.keys(scores) as (keyof OfferScores)[]
  const sum = keys.reduce((acc, k) => acc + (scores[k]?.score ?? 0), 0)
  return Math.round((sum / keys.length) * 10) / 10
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({ dimensionKey, scoreData }: {
  dimensionKey: keyof OfferScores
  scoreData: { score: number; max: number; comment: string }
}) {
  const color = getScoreColor(scoreData.score)
  const bg = getScoreBg(scoreData.score)
  const border = getScoreBorder(scoreData.score)
  const label = SCORE_LABELS[dimensionKey]
  const pct = (scoreData.score / scoreData.max) * 100

  return (
    <div
      style={{
        background: bg, border: `1px solid ${border}`,
        borderRadius: 12, padding: '16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#94a3b8', lineHeight: 1.3 }}>{label}</span>
        <span style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
          {scoreData.score}
          <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>/{scoreData.max}</span>
        </span>
      </div>

      {/* Bar */}
      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%', width: `${pct}%`,
            background: color, borderRadius: 99,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{scoreData.comment}</p>
    </div>
  )
}

// ─── Xray Accordion ──────────────────────────────────────────────────────────

function XraySection({ xray }: { xray: OfferXray }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Raio-X da Copy</span>
        {open ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </button>

      {open && (
        <div
          style={{
            padding: '0 18px 18px',
            display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'slideUpFade 0.18s ease-out',
          }}
        >
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Hook Type */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Tipo de Hook
            </p>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '5px 14px', borderRadius: 99,
                background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.25)',
                fontSize: 13, fontWeight: 600, color: '#d8f8ff',
              }}
            >
              {xray.hook_type}
            </div>
          </div>

          {/* Mechanism */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
              Mecanismo Identificado
            </p>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>{xray.identified_mechanism}</p>
          </div>

          {/* Offer elements */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
              Elementos Presentes
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {xray.offer_elements.map((el, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 11px', borderRadius: 99,
                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                    fontSize: 12, fontWeight: 600, color: '#6ee7b7',
                  }}
                >
                  <span style={{ fontSize: 11 }}>✓</span> {el}
                </span>
              ))}
            </div>
          </div>

          {/* Missing elements */}
          {xray.missing_elements.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                Elementos Ausentes
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {xray.missing_elements.map((el, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 11px', borderRadius: 99,
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                      fontSize: 12, fontWeight: 600, color: '#fca5a5',
                    }}
                  >
                    <span style={{ fontSize: 11 }}>✕</span> {el}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frameworks */}
          {xray.copywriting_frameworks_detected.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                Frameworks Detectados
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {xray.copywriting_frameworks_detected.map((fw, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '4px 11px', borderRadius: 99,
                      background: 'rgba(76,201,240,0.12)', border: '1px solid rgba(76,201,240,0.25)',
                      fontSize: 12, fontWeight: 600, color: '#d8f8ff',
                    }}
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Suggestion Item ──────────────────────────────────────────────────────────

function SuggestionItem({ suggestion }: { suggestion: ModelingSuggestion }) {
  const ps = getPriorityStyle(suggestion.priority)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 99,
            fontSize: 10.5, fontWeight: 700,
            background: 'rgba(76,201,240,0.12)', color: '#d8f8ff', border: '1px solid rgba(76,201,240,0.25)',
          }}
        >
          {suggestion.dimension}
        </span>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 10px', borderRadius: 99,
            fontSize: 10.5, fontWeight: 700,
            background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
          }}
        >
          Prioridade {ps.label}
        </span>
      </div>

      {/* Current state */}
      <div>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
          Estado atual
        </p>
        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, fontStyle: 'italic' }}>
          &ldquo;{suggestion.current}&rdquo;
        </p>
      </div>

      {/* Suggestion */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, padding: '11px 14px',
        }}
      >
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#4cc9f0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
          Sugestao
        </p>
        <p style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
          {suggestion.suggestion}
        </p>
      </div>
    </div>
  )
}

// ─── Analysis Loader ─────────────────────────────────────────────────────────

function AnalysisLoader() {
  return (
    <div style={{
      position: 'relative', width: 320, height: 320,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 10,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(76,201,240,0.2) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
        <defs>
          <linearGradient id="anlRing1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="anlRing2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="50%" stopColor="#d946ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="anlRing3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0" />
            <stop offset="50%" stopColor="#f0abfc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="3s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#anlRing1)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5.5" fill="#c084fc">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="12" fill="#a855f7" opacity="0">
            <animate attributeName="opacity" values="0;0.15;0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="55 110 110" to="415 110 110" dur="4.5s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#anlRing2)" strokeWidth="1.5" />
          <path d="M202 106 L203.8 109.5 L207.5 110 L203.8 112.5 L202 116 L200.2 112.5 L196.5 110 L200.2 107 Z" fill="#d946ef">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </path>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="-60 110 110" to="300 110 110" dur="6s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#anlRing3)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5" fill="none" stroke="#a78bfa" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="2.5" fill="#a78bfa">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="110 110 110" to="470 110 110" dur="5s" repeatCount="indefinite" />
          <circle cx="178" cy="110" r="3.5" fill="#d8b4fe">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* Spinning ring — NO translate so rotate animation doesn't fight it */}
      <div style={{
        position: 'absolute', width: 74, height: 74, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #8b5cf6, #d946ef, #c084fc, #a855f7, #8b5cf6)',
        animation: 'spin 2.4s linear infinite',
        zIndex: 2,
      }} />
      {/* Dark disc + icon — centered by flex parent */}
      <div style={{
        position: 'absolute', width: 68, height: 68, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(8,10,22,0.98), rgba(14,16,28,0.98))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        zIndex: 3,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="anlScanGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f0abfc" />
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="6" stroke="url(#anlScanGrad)" strokeWidth="1.8" />
          <path d="M21 21l-5-5" stroke="url(#anlScanGrad)" strokeWidth="2" strokeLinecap="round" />
          <path d="M7 10h6M10 7v6" stroke="url(#anlScanGrad)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalisadorPage() {
  const [pageState, setPageState] = useState<PageState>('input')
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisSummary[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Input state
  const [sourceUrl, setSourceUrl] = useState('')
  const [urlFocused, setUrlFocused] = useState(false)

  // Result state
  const [analysis, setAnalysis] = useState<GenerateOfferAnalysisOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }, [])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/offer-analysis', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar histórico')
      const json = await res.json()
      setRecentAnalyses(json.analyses ?? [])
    } catch {
      // silent
    } finally {
      setLoadingHistory(false)
    }
  }, [getToken])

  // Initial history load is intentionally triggered on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadHistory() }, [loadHistory])

  async function handleAnalyze() {
    if (!sourceUrl.trim()) return
    setPageState('analyzing')
    setError(null)

    try {
      const token = await getToken()
      const res = await fetch('/api/offer-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Falha ao analisar oferta')
      }
      const json = await res.json()
      setAnalysis(json.analysis.analysis as GenerateOfferAnalysisOutput)
      setPageState('result')
      loadHistory()
    } catch (err) {
      setError((err as Error).message)
      setPageState('input')
    }
  }

  async function handleLoadAnalysis(id: string) {
    try {
      const token = await getToken()
      const res = await fetch(`/api/offer-analysis/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar análise')
      const json = await res.json()
      const a = json.analysis as AnalysisFull
      setAnalysis(a.analysis)
      setPageState('result')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function handleReset() {
    setPageState('input')
    setAnalysis(null)
    setSourceUrl('')
    setError(null)
  }

  const canAnalyze = sourceUrl.trim().length > 0

  const pageBg = `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                  radial-gradient(ellipse at 50% 80%, #0d2137 0%, transparent 50%),
                  #080810`
  const shellStyle = {
    position: 'relative' as const,
    zIndex: 1,
    width: '100%',
    maxWidth: 1120,
    margin: '0 auto',
    padding: '28px 24px 40px',
  }

  const premiumCardStyle = {
    background: 'rgba(10,12,22,0.86)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 24,
    boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(18px)',
  } as const

  // ── RENDER: analyzing ─────────────────────────────────────────────────────

  if (pageState === 'analyzing') {
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: pageBg, minHeight: '100vh', position: 'relative',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnalysisLoader />
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 26, fontWeight: 800, marginBottom: 10, marginTop: 28,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Analisando sua oferta...
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Nosso agente está auditando cada elemento da oferta.
          </p>
          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #8b5cf6, #d946ef, #c084fc)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s ease-in-out infinite',
              }}
            />
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
            Nosso sistema está extraindo e analisando a URL...
          </p>
        </div>
      </div>
    )
  }

  // ── RENDER: result ────────────────────────────────────────────────────────

  if (pageState === 'result' && analysis) {
    const scoreKeys = Object.keys(analysis.scores) as (keyof OfferScores)[]
    const overallScoreVal = calcOverallScore(analysis.scores)
    const overallColor = getScoreColor(overallScoreVal)

    // Sort suggestions by priority
    const sortedSuggestions = [...(analysis.modeling_suggestions ?? [])].sort((a, b) => {
      const order = { alta: 0, média: 1, baixa: 2 }
      return order[a.priority] - order[b.priority]
    })

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: pageBg, overflow: 'auto' }}>
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.4 }} />
        <div style={shellStyle}>
          <div style={{ ...premiumCardStyle, padding: '24px 24px 22px', marginBottom: 18, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(76,201,240,0.22)', background: 'rgba(76,201,240,0.08)', color: '#d8f8ff', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
              Nosso agente concluiu
            </div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              Análise de Oferta
            </h1>
            <p style={{ maxWidth: 760, margin: '0 auto', color: '#94a3b8', fontSize: 14.5, lineHeight: 1.65 }}>
              {analysis.summary}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <button
                onClick={handleReset}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 999,
                  background: 'rgba(76,201,240,0.10)', border: '1px solid rgba(76,201,240,0.22)',
                  color: '#d8f8ff', fontSize: 13.5, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <ScanSearch size={14} /> Nova análise
              </button>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.03)', color: '#cbd5e1', fontSize: 13.5, fontWeight: 600 }}>
                Score geral: <span style={{ color: overallColor, fontWeight: 800 }}>{overallScoreVal}/10</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
            <div style={premiumCardStyle}>
              <div style={{ padding: '20px 20px 0' }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                  Dimensões avaliadas
                </h2>
              </div>
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 12,
                  }}
                >
                  {scoreKeys.map(key => (
                    <ScoreCard key={key} dimensionKey={key} scoreData={analysis.scores[key]} />
                  ))}
                </div>
              </div>
            </div>

            <div style={premiumCardStyle}>
              <XraySection xray={analysis.xray} />
            </div>

            {sortedSuggestions.length > 0 && (
              <div style={premiumCardStyle}>
                <div style={{ padding: '20px 20px 0' }}>
                  <h2 style={{ fontSize: 13, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                    Sugestões de modelagem
                  </h2>
                </div>
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sortedSuggestions.map((s, i) => (
                    <SuggestionItem key={i} suggestion={s} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: input view ────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: pageBg, overflow: 'auto' }}>
      <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />

      <div style={shellStyle}>
        <div style={{ ...premiumCardStyle, padding: '28px 26px', marginBottom: 18, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(76,201,240,0.22)', background: 'rgba(76,201,240,0.08)', color: '#d8f8ff', fontSize: 12, fontWeight: 700, marginBottom: 14 }}>
            Raio X de oferta
          </div>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
              margin: '0 0 10px',
            }}
          >
            Analista de Oferta
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: '0 auto', maxWidth: 760 }}>
            Cole apenas a URL. Nossos agentes acessam a página, analisam cada detalhe e geram uma análise completa da oferta.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(76,201,240,0.18)', background: 'rgba(76,201,240,0.08)', color: '#d8f8ff', fontSize: 13, fontWeight: 600 }}>
              Nosso sistema extrai HTML
            </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(76,201,240,0.18)', background: 'rgba(76,201,240,0.08)', color: '#d8f8ff', fontSize: 13, fontWeight: 600 }}>
            Sem texto manual
          </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(251,191,36,0.18)', background: 'rgba(251,191,36,0.08)', color: '#fde68a', fontSize: 13, fontWeight: 600 }}>
              Leitura estruturada
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: '#fca5a5', fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <div style={{ ...premiumCardStyle, padding: '22px', marginBottom: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720, margin: '0 auto' }}>
            <div>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.45px' }}>
                URL da página
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://exemplo.com.br/pagina-de-vendas"
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: urlFocused ? '1px solid rgba(76,201,240,0.52)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  color: '#e2e8f0',
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxShadow: urlFocused ? '0 0 0 4px rgba(76,201,240,0.1)' : 'none',
                  transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
                }}
                onFocus={() => setUrlFocused(true)}
                onBlur={() => setUrlFocused(false)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 13.5, lineHeight: 1.6, maxWidth: 520 }}>
                Nossos agentes acessam a página, analisam cada detalhe e geram uma análise completa da oferta.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                style={{
                  minWidth: 180,
                  padding: '14px 18px',
                  background: canAnalyze
                    ? 'linear-gradient(135deg, #4cc9f0, #a855f7, #fbbf24)'
                    : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: 14,
                  color: canAnalyze ? '#fff' : '#64748b',
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: canAnalyze ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  boxShadow: canAnalyze ? '0 10px 30px rgba(76,201,240,0.22)' : 'none',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { if (canAnalyze) { e.currentTarget.style.boxShadow = '0 14px 36px rgba(76,201,240,0.28)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = canAnalyze ? '0 10px 30px rgba(76,201,240,0.22)' : 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Analisar URL
              </button>
            </div>
          </div>
        </div>

        <HistoryPanel analyses={recentAnalyses} loading={loadingHistory} onSelect={handleLoadAnalysis} />
      </div>
    </div>
  )
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel({
  analyses,
  loading,
  onSelect,
}: {
  analyses: AnalysisSummary[]
  loading: boolean
  onSelect: (id: string) => void
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(10,14,26,0.9) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 24,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 18px 60px rgba(2,6,23,0.32)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: 12.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
            Análises recentes
          </h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
            Acesso rápido aos últimos diagnósticos do nosso agente.
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '28px 0' }}>
          <div className="spinner" />
        </div>
      )}

      {!loading && analyses.length === 0 && (
        <p style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', padding: '22px 0', margin: 0 }}>
          Nenhuma análise ainda
        </p>
      )}

      {!loading && analyses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {analyses.map(a => {
            const title = a.source_url
              ? a.source_url.replace(/^https?:\/\//, '').slice(0, 45)
              : a.preview?.slice(0, 50) ?? 'Análise sem título'

            return (
              <button
                key={a.id}
                onClick={() => onSelect(a.id)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  borderRadius: 16,
                  padding: '14px 15px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(168,85,247,0.09)'
                  e.currentTarget.style.borderColor = 'rgba(168,85,247,0.22)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: '0 0 6px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </p>
                <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                  {formatDate(a.created_at)}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
