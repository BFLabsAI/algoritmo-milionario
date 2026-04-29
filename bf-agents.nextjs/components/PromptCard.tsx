'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Prompt = { id: string; title: string; description: string | null; content: string; category: string | null; required_plan: string; model_slug: string | null }

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const isPro = prompt.required_plan !== 'free'

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleUse() {
    const params = new URLSearchParams()
    params.set('prompt', prompt.content)
    if (prompt.model_slug) params.set('model', prompt.model_slug)
    router.push(`/dashboard/chat?${params.toString()}`)
  }

  return (
    <div className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isPro && <div className="badge badge-purple" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10 }}>PRO</div>}
      <h3 style={{ fontSize: 14, fontWeight: 600, paddingRight: isPro ? 40 : 0 }}>{prompt.title}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{prompt.description}</p>
      {prompt.model_slug && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', padding: '4px 8px', borderRadius: 6, background: 'var(--surface-2)', display: 'inline-block' }}>
          🤖 {prompt.model_slug.split('/').pop()}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button onClick={handleCopy} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
          {copied ? '✓ Copiado' : '📋 Copiar'}
        </button>
        <button onClick={handleUse} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          Usar no Chat →
        </button>
      </div>
    </div>
  )
}
