'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Prompt = {
  id: string
  title: string
  description: string | null
  content: string
  category: string | null
  required_plan: string
  model_slug: string | null
}

function getModelLabel(modelSlug: string) {
  if (modelSlug === 'scale-ai-pro') return 'Scale AI PRO'
  return modelSlug.split('/').pop() ?? modelSlug
}

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleUse() {
    const params = new URLSearchParams()
    params.set('prompt', prompt.content)
    if (prompt.model_slug) params.set('model', prompt.model_slug)
    router.push(`/dashboard/chat?${params.toString()}`)
  }

  return (
    <article
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: '100%',
        width: '100%',
        padding: 18,
        borderRadius: 22,
        background: 'linear-gradient(180deg, rgba(22,16,40,0.86) 0%, rgba(10,10,18,0.94) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 18px 48px rgba(0,0,0,0.26)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 10px',
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {prompt.category ?? 'Geral'}
        </div>
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#f8fafc',
          lineHeight: 1.25,
        }}
      >
        {prompt.title}
      </h3>

      <p
        style={{
          fontSize: 12.5,
          color: '#94a3b8',
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {prompt.description}
      </p>

      {prompt.model_slug && (
        <div
          style={{
            display: 'inline-flex',
            width: 'fit-content',
            padding: '4px 9px',
            borderRadius: 9999,
            background: 'rgba(76,201,240,0.08)',
            border: '1px solid rgba(76,201,240,0.14)',
            color: '#d8f8ff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {getModelLabel(prompt.model_slug)}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0',
            padding: '10px 12px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
        <button
          onClick={handleUse}
          style={{
            flex: 1,
            borderRadius: 12,
            border: '1px solid rgba(76,201,240,0.18)',
            background: 'linear-gradient(135deg, rgba(76,201,240,0.12), rgba(168,85,247,0.12))',
            color: '#eef8ff',
            padding: '10px 12px',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Usar no Chat
        </button>
      </div>
    </article>
  )
}
