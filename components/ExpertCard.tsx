'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles } from 'lucide-react'

type Agent = { id: string; slug: string; name: string; description: string | null; category: string | null; required_plan: string; default_model: string }

const ICONS: Record<string, string> = { geral: '⭐', copywriting: '✍️', ads: '📣', email: '📧', reels: '🎬', vendas: '💰' }
const CATEGORY_LABELS: Record<string, string> = {
  geral: 'Geral', copywriting: 'Copywriting', ads: 'Anúncios',
  email: 'Email Marketing', reels: 'Reels & Vídeo', vendas: 'Vendas',
}

export default function ExpertCard({ agent }: { agent: Agent }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [btnHovered, setBtnHovered] = useState(false)
  const icon = ICONS[agent.category ?? 'geral'] ?? '🤖'
  const categoryLabel = CATEGORY_LABELS[agent.category ?? 'geral'] ?? agent.category ?? ''
  const isPro = agent.required_plan !== 'free'

  const activate = () => router.push(`/dashboard/chat?agentId=${agent.id}&model=${agent.default_model}`)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: 22,
        borderRadius: 20,
        background: 'linear-gradient(180deg, rgb(20, 22, 38) 0%, rgb(12, 14, 26) 100%)',
        border: hovered ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: hovered
          ? '0 16px 32px -12px rgba(0,0,0,0.6)'
          : '0 8px 24px -8px rgba(0,0,0,0.4)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s ease',
        minHeight: 240,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'contents' }}>
        {/* Top gradient hairline */}
        <div
          style={{
            position: 'absolute', top: 0, left: 20, right: 20, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          }}
        />

        {/* Soft glow blob */}
        <div
          style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)',
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />

        {/* Header row: icon + PRO badge */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, position: 'relative' }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(59,130,246,0.12) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            {icon}
          </div>

          {isPro && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 999,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.6px',
                color: '#c4b5fd',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.08))',
                border: '1px solid rgba(139,92,246,0.35)',
                boxShadow: '0 0 12px rgba(139,92,246,0.15)',
              }}
            >
              <Sparkles size={10} strokeWidth={2.5} />
              PRO
            </div>
          )}
        </div>

        {/* Category tag */}
        {categoryLabel && (
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase',
                color: '#94a3b8',
              }}
            >
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Name */}
        <h3
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 17, fontWeight: 700, lineHeight: 1.25, marginBottom: 8,
            color: '#fff', letterSpacing: '-0.01em',
          }}
        >
          {agent.name}
        </h3>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55, flex: 1, marginBottom: 18 }}>
          {agent.description}
        </p>

        {/* Activate button */}
        <button
          onClick={activate}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            position: 'relative',
            padding: '11px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.04)',
            border: btnHovered
              ? '1px solid rgba(139,92,246,0.5)'
              : '1px solid rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(8px)',
            boxShadow: btnHovered
              ? '0 0 24px rgba(139,92,246,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
              : 'inset 0 1px 0 rgba(255,255,255,0.06)',
            transition: 'all 0.2s ease',
            letterSpacing: '0.2px',
          }}
        >
          Ativar agente
        </button>
      </div>
    </div>
  )
}
