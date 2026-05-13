'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ArrowLeft, Copy, Check, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import type {
  GenerateProductOutput,
  VslSection,
  ProductBump,
  ProductUpsell,
  ProductDownsell,
  UniqueMechanism,
} from '@/lib/ai-generators'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductSummary = {
  id: string
  product_name: string | null
  market: string
  price: number
  status: 'generated' | 'saved'
  created_at: string
}

type ProductFull = ProductSummary & GenerateProductOutput & {
  raw_description: string
  icp: string
  differentials: string
}

type View = 'list' | 'form' | 'generating' | 'result'
type TabId = 'identidade' | 'mecanismo' | 'vsl' | 'funil'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GENERATING_STEPS = [
  'Identificando mecanismo único...',
  'Analisando equação de valor (Hormozi)...',
  'Estruturando VSL com método RMBC...',
  'Criando funil de vendas...',
  'Gerando headlines de alta conversão...',
  'Finalizando produto...',
]

function HeadlineCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        cursor: 'pointer', transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => {
        setHovered(true)
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'
        e.currentTarget.style.background = 'rgba(99,102,241,0.05)'
      }}
      onMouseLeave={e => {
        setHovered(false)
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
      onClick={handleCopy}
    >
      <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
        {text}
      </p>
      <button
        style={{
          flexShrink: 0, background: 'transparent', border: 'none',
          color: copied ? '#10b981' : hovered ? '#a78bfa' : '#64748b',
          cursor: 'pointer', padding: 4, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color 0.18s ease',
        }}
        aria-label="Copiar headline"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  )
}

function VslAccordionItem({ section }: { section: VslSection }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, overflow: 'hidden',
        transition: 'border-color 0.18s ease',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{section.section}</span>
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>{section.objective}</span>
        </div>
        {open
          ? <ChevronUp size={15} color="#64748b" />
          : <ChevronDown size={15} color="#64748b" />}
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', animation: 'slideUpFade 0.18s ease-out' }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
          <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 10 }}>{section.objective}</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.key_points.map((pt, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
                <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }}>•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FunnelCard({
  label,
  item,
  accentColor,
}: {
  label: string
  item: ProductBump | ProductUpsell | ProductDownsell
  accentColor: string
}) {
  const why = 'why' in item ? item.why : ('positioning' in item ? item.positioning : '')

  return (
    <div
      style={{
        flex: 1, background: 'rgba(255,255,255,0.03)', border: `1px solid ${accentColor}22`,
        borderRadius: 12, padding: '20px', minWidth: 200,
      }}
    >
      <div
        style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 10px', borderRadius: 99,
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
          background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}33`,
          marginBottom: 12,
        }}
      >
        {label}
      </div>
      <h4 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 8, lineHeight: 1.35 }}>
        {item.name}
      </h4>
      <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 12 }}>
        {item.description}
      </p>
      <div
        style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '5px 12px', borderRadius: 8,
          background: `${accentColor}10`, border: `1px solid ${accentColor}28`,
          fontSize: 14, fontWeight: 700, color: accentColor, marginBottom: 10,
        }}
      >
        {item.price_suggestion}
      </div>
      <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{why}</p>
    </div>
  )
}

// ─── Product Loader ───────────────────────────────────────────────────────────

function ProductLoader() {
  return (
    <div style={{
      position: 'relative', width: 320, height: 320,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 10,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
        <defs>
          <linearGradient id="prodRing1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="prodRing2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="prodRing3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="3s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#prodRing1)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5.5" fill="#fbbf24">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="12" fill="#f59e0b" opacity="0">
            <animate attributeName="opacity" values="0;0.15;0" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="r" values="9;14;9" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="60 110 110" to="420 110 110" dur="4.5s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#prodRing2)" strokeWidth="1.5" />
          <path d="M202 106 L203.8 109.5 L207.5 110 L203.8 112.5 L202 116 L200.2 112.5 L196.5 110 L200.2 107 Z" fill="#818cf8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </path>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="-55 110 110" to="305 110 110" dur="6s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#prodRing3)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5" fill="none" stroke="#34d399" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="2.5" fill="#34d399">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="120 110 110" to="480 110 110" dur="4.8s" repeatCount="indefinite" />
          <circle cx="178" cy="110" r="3.5" fill="#fbbf24">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* Spinning ring — NO translate so rotate animation doesn't fight it */}
      <div style={{
        position: 'absolute', width: 74, height: 74, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #f59e0b, #6366f1, #10b981, #fbbf24, #f59e0b)',
        animation: 'spin 2.4s linear infinite',
        zIndex: 2,
      }} />
      {/* Dark disc + icon — centered by flex parent */}
      <div style={{
        position: 'absolute', width: 68, height: 68, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(10,8,22,0.98), rgba(18,14,28,0.98))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        zIndex: 3,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="prodBulbGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path d="M9 21h6M12 3a6 6 0 0 1 4.243 10.243C15.5 14 15 15 15 16H9c0-1-.5-2-1.243-2.757A6 6 0 0 1 12 3z" stroke="url(#prodBulbGrad)" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 16h6" stroke="url(#prodBulbGrad)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CriadorProdutoPage() {
  const [view, setView] = useState<View>('list')
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Result state
  const [product, setProduct] = useState<ProductFull | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('identidade')
  const [vslMode, setVslMode] = useState<'vsl' | 'tsl'>('vsl')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [openingProductId, setOpeningProductId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    rawDescription: '',
    market: '',
    price: '',
    icp: '',
    differentials: '',
  })

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }, [])

  // Load products list
  const loadProducts = useCallback(async () => {
    setLoadingList(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar produtos')
      const json = await res.json()
      setProducts(json.products ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingList(false)
    }
  }, [getToken])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Animate generating steps
  useEffect(() => {
    if (view !== 'generating') return
    setCurrentStep(0)
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < GENERATING_STEPS.length - 1) return prev + 1
        return prev
      })
    }, 2200)
    return () => clearInterval(interval)
  }, [view])

  async function handleCreate() {
    if (!form.rawDescription || !form.market || !form.price || !form.icp || !form.differentials) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    const priceNum = parseFloat(form.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Preço inválido')
      return
    }

    setView('generating')
    setError(null)

    try {
      const token = await getToken()
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          rawDescription: form.rawDescription,
          market: form.market,
          price: priceNum,
          icp: form.icp,
          differentials: form.differentials,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Falha ao criar produto')
      }
      const json = await res.json()
      setProduct(json.product as ProductFull)
      setSaved(json.product.status === 'saved')
      setActiveTab('identidade')
      setView('result')
      loadProducts()
    } catch (err) {
      setError((err as Error).message)
      setView('form')
    }
  }

  async function handleSave() {
    if (!product) return
    setSaving(true)
    try {
      const token = await getToken()
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'saved' }),
      })
      setSaved(true)
      loadProducts()
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  async function openProduct(id: string) {
    setOpeningProductId(id)
    setError(null)

    try {
      const token = await getToken()
      const res = await fetch(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao abrir produto')

      const json = await res.json() as { product: ProductFull }
      setProduct(json.product)
      setSaved(json.product.status === 'saved')
      setActiveTab('identidade')
      setVslMode('vsl')
      setView('result')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setOpeningProductId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12.5, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block',
  }

  const pageBg = `radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
                  radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.05) 0%, transparent 50%),
                  #080a16`

  // ── RENDER: generating ────────────────────────────────────────────────────

  if (view === 'generating') {
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: pageBg, minHeight: '100dvh', position: 'relative',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 520, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <ProductLoader />

          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 26, fontWeight: 800, marginBottom: 10, marginTop: 28,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Criando seu produto...
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Analisando com Alex Hormozi e Stefan Georgi
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left', width: '100%' }}>
            {GENERATING_STEPS.map((step, i) => {
              const isActive = i === currentStep
              const isDone = i < currentStep
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '9px 14px', borderRadius: 10,
                    background: isActive ? 'rgba(245,158,11,0.1)' : isDone ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.02)',
                    border: isActive ? '1px solid rgba(245,158,11,0.3)' : isDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.35s ease',
                    opacity: i > currentStep ? 0.35 : 1,
                  }}
                >
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#10b981' : isActive ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {isDone
                      ? <Check size={11} color="#fff" />
                      : isActive
                      ? <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse-dot-scale 1s ease infinite' }} />
                      : null
                    }
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: isActive ? 600 : 400, color: isActive ? '#fde68a' : isDone ? '#6ee7b7' : '#475569' }}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #f59e0b, #6366f1, #10b981)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite',
                width: `${((currentStep + 1) / GENERATING_STEPS.length) * 100}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: result view ───────────────────────────────────────────────────

  if (view === 'result' && product) {
    const TABS: { id: TabId; label: string }[] = [
      { id: 'identidade', label: 'Identidade' },
      { id: 'mecanismo', label: 'Mecanismo Único' },
      { id: 'vsl', label: 'VSL / TSL' },
      { id: 'funil', label: 'Funil' },
    ]

    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: pageBg, overflow: 'auto',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 960, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setView('list'); setProduct(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, padding: '7px 13px', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                  fontSize: 22, fontWeight: 800, color: '#fff', margin: 0,
                }}
              >
                {product.product_name ?? 'Produto Gerado'}
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>{product.market}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 10,
                background: saved ? 'rgba(16,185,129,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none',
                color: saved ? '#6ee7b7' : '#fff',
                fontSize: 13, fontWeight: 600, cursor: saved ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
                transition: 'all 0.18s ease',
              }}
            >
              {saved ? <><Check size={14} /> Salvo</> : saving ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>

          {/* Tabs */}
          <div className="toolbar-rail" style={{ gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '9px 18px', background: 'transparent', border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: activeTab === tab.id ? '#a78bfa' : '#64748b',
                  fontSize: 13.5, fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'color 0.18s ease, border-color 0.18s ease',
                  marginBottom: -1,
                }}
                onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#94a3b8' }}
                onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#64748b' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}

          {/* ── Tab: Identidade */}
          {activeTab === 'identidade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideUpFade 0.2s ease-out' }}>
              {/* Product name hero */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 14, padding: '24px 28px', textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Nome do Produto
                </p>
                <h2
                  style={{
                    fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                    fontSize: 32, fontWeight: 800, lineHeight: 1.2,
                    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    margin: 0,
                  }}
                >
                  {product.product_name}
                </h2>
                <p style={{ marginTop: 14, fontSize: 14, color: '#94a3b8', lineHeight: 1.6, maxWidth: 600, margin: '14px auto 0' }}>
                  {product.description}
                </p>
              </div>

              {/* Headlines */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>
                  Headlines — clique para copiar
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(product.headlines ?? []).map((h, i) => (
                    <HeadlineCard key={i} text={h} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: Mecanismo Único */}
          {activeTab === 'mecanismo' && (
            <div style={{ animation: 'slideUpFade 0.2s ease-out' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {(
                  [
                    { key: 'problem_mechanism' as keyof UniqueMechanism, label: 'Mecanismo do Problema', color: '#ef4444', icon: '⚡' },
                    { key: 'solution_mechanism' as keyof UniqueMechanism, label: 'Mecanismo da Solução', color: '#10b981', icon: '✅' },
                  ] as const
                ).map(({ key, label, color, icon }) => (
                  <div
                    key={key}
                    style={{
                      flex: '1 1 300px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22`,
                      borderRadius: 14, padding: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>{label}</h3>
                    </div>
                    <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>
                      {product.unique_mechanism?.[key] ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: VSL / TSL */}
          {activeTab === 'vsl' && (
            <div style={{ animation: 'slideUpFade 0.2s ease-out' }}>
              {/* Toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['vsl', 'tsl'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setVslMode(mode)}
                    style={{
                      padding: '8px 22px', borderRadius: 9,
                      background: vslMode === mode ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      border: vslMode === mode ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.1)',
                      color: vslMode === mode ? '#a78bfa' : '#64748b',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.18s ease',
                      textTransform: 'uppercase',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(vslMode === 'vsl' ? product.vsl_structure : product.tsl_structure)?.map((section, i) => (
                  <VslAccordionItem key={i} section={section} />
                ))}
              </div>
            </div>
          )}

          {/* ── Tab: Funil */}
          {activeTab === 'funil' && (
            <div style={{ animation: 'slideUpFade 0.2s ease-out' }}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <FunnelCard label="Order Bump" item={product.order_bump} accentColor="#3b82f6" />
                <FunnelCard label="Upsell" item={product.upsell} accentColor="#10b981" />
                <FunnelCard label="Downsell" item={product.downsell} accentColor="#f59e0b" />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── RENDER: form ──────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: pageBg, overflow: 'auto',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 700, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setView('list'); setError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, padding: '7px 13px', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                  fontSize: 22, fontWeight: 800, color: '#fff', margin: 0,
                }}
              >
                Criar Produto com IA
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>
                Metodologia Hormozi + Stefan Georgi
              </p>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '28px',
            }}
          >
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Descrição bruta do produto *</label>
                <textarea
                  value={form.rawDescription}
                  onChange={e => setForm(f => ({ ...f, rawDescription: e.target.value }))}
                  placeholder="Descreva o produto da forma que está na sua cabeça, sem filtros. Quanto mais detalhe, melhor..."
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 180 }}>
                  <label style={labelStyle}>Mercado / nicho *</label>
                  <input
                    type="text"
                    value={form.market}
                    onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                    placeholder="Ex: Marketing digital, Fitness, Finanças..."
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Preço em R$ *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="497"
                    min={1}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>ICP — Perfil de Cliente Ideal *</label>
                <textarea
                  value={form.icp}
                  onChange={e => setForm(f => ({ ...f, icp: e.target.value }))}
                  placeholder="Quem é o seu cliente ideal? Idade, situação atual, maior dor, maior desejo..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Diferenciais *</label>
                <textarea
                  value={form.differentials}
                  onChange={e => setForm(f => ({ ...f, differentials: e.target.value }))}
                  placeholder="O que torna este produto único? Método proprietário, resultados comprovados, garantia diferenciada..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              <button
                onClick={handleCreate}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 11,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                  transition: 'all 0.18s ease', marginTop: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 32px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Criar Produto
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: list view ─────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: pageBg, overflow: 'auto' }}>
      <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />
      <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                fontSize: 'var(--fs-h1)', fontWeight: 800, color: '#fff', margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >
              Criador de Produtos
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              Estrutura Hormozi + Stefan Georgi — VSL, funil e mecanismo único
            </p>
          </div>
          <button
            onClick={() => { setView('form'); setError(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 11,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loadingList && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Empty state */}
        {!loadingList && products.length === 0 && (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 0', textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}
            >
              <Lightbulb size={28} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
              Nenhum produto criado ainda
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              Crie seu primeiro produto com estrutura de oferta completa
            </p>
            <button
              onClick={() => setView('form')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={15} /> Criar primeiro produto
            </button>
          </div>
        )}

        {/* Products grid */}
        {!loadingList && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <div
                key={p.id}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '20px',
                  transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
                  e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35, flex: 1, margin: 0 }}>
                    {p.product_name ?? 'Produto sem nome'}
                  </h3>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 9px', borderRadius: 99,
                      fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                      background: p.status === 'saved' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                      color: p.status === 'saved' ? '#10b981' : '#818cf8',
                      border: `1px solid ${p.status === 'saved' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                    }}
                  >
                    {p.status === 'saved' ? 'Salvo' : 'Gerado'}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{p.market}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 10px', borderRadius: 99,
                      fontSize: 12, fontWeight: 700,
                      background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)',
                    }}
                  >
                    R$ {p.price?.toLocaleString('pt-BR') ?? '—'}
                  </span>
                </div>

                <button
                  onClick={() => openProduct(p.id)}
                  disabled={openingProductId === p.id}
                  style={{
                    width: '100%', padding: '9px',
                    background: openingProductId === p.id ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 9, color: '#818cf8', fontSize: 13, fontWeight: 600,
                    cursor: openingProductId === p.id ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)' }}
                >
                  {openingProductId === p.id ? 'Abrindo...' : 'Ver Produto'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
