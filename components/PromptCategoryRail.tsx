'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PromptCard from '@/components/PromptCard'

type Prompt = {
  id: string
  title: string
  description: string | null
  content: string
  category: string | null
  required_plan: string
  model_slug: string | null
}

export default function PromptCategoryRail({
  title,
  subtitle,
  count,
  prompts,
}: {
  title: string
  subtitle: string
  count: number
  prompts: Prompt[]
}) {
  const railRef = useRef<HTMLDivElement>(null)

  function scrollByCards(direction: 'left' | 'right') {
    const rail = railRef.current
    if (!rail) return
    const amount = Math.max(rail.clientWidth * 0.82, 320)
    rail.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <section
      style={{
        borderRadius: 28,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.34)',
        backdropFilter: 'blur(24px)',
        overflow: 'hidden',
        padding: '22px 22px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            {title}
          </h3>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            {subtitle}
          </p>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: 9999,
            background: 'rgba(168,85,247,0.10)',
            border: '1px solid rgba(168,85,247,0.18)',
            color: '#e9d5ff',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {count} prompts
        </span>
      </div>

      {/* Rail layout: nav buttons hidden on mobile (< 768px) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => scrollByCards('left')}
          aria-label="Voltar prompts"
          className="hide-mobile"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <div
          ref={railRef}
          className="toolbar-rail"
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(160px, 1fr)',
            gap: 12,
            overflowX: 'auto',
            paddingBottom: 6,
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {prompts.map(prompt => (
            <div key={prompt.id} style={{ scrollSnapAlign: 'start' }}>
              <PromptCard prompt={prompt} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByCards('right')}
          aria-label="Avançar prompts"
          className="hide-mobile"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
