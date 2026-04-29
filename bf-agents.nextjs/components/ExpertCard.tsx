'use client'
import { useRouter } from 'next/navigation'

type Agent = { id: string; slug: string; name: string; description: string | null; category: string | null; required_plan: string; default_model: string }

const ICONS: Record<string, string> = { geral: '⭐', copywriting: '✍️', ads: '📣', email: '📧', reels: '🎬', vendas: '💰' }
const COLORS: Record<string, string> = { geral: 'var(--accent)', copywriting: 'var(--purple)', ads: '#f59e0b', email: 'var(--teal)', reels: '#ef4444', vendas: 'var(--success)' }

export default function ExpertCard({ agent }: { agent: Agent }) {
  const router = useRouter()
  const icon = ICONS[agent.category ?? 'geral'] ?? '🤖'
  const color = COLORS[agent.category ?? 'geral'] ?? 'var(--accent)'
  const isPro = agent.required_plan !== 'free'

  return (
    <div
      className="card card-interactive"
      style={{ cursor: 'pointer', position: 'relative', opacity: isPro ? 0.8 : 1 }}
      onClick={() => router.push(`/dashboard/chat?agentId=${agent.id}&model=${agent.default_model}`)}
    >
      {isPro && (
        <div className="badge badge-purple" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10 }}>PRO</div>
      )}
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 14,
        background: `${color}20`, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{agent.name}</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{agent.description}</p>
      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>→</span> Conversar com este expert
      </div>
    </div>
  )
}
