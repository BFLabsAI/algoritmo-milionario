'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquarePlus, Trash2 } from 'lucide-react'

type Conversation = {
  id: string
  title: string | null
  model_slug: string
  agent_id: string | null
  updated_at: string
}

type Props = {
  activeCid: string | null
  onSelect: (cid: string | null) => void
  refreshKey?: number
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ChatHistorySidebar({ activeCid, onSelect, refreshKey }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [newHovered, setNewHovered] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setLoading(false); return }

    try {
      const res = await fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setLoading(false); return }
      const json = await res.json()
      setConversations(json.conversations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  async function handleDelete(cid: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Excluir esta conversa?')) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    setConversations(prev => prev.filter(c => c.id !== cid))
    if (activeCid === cid) onSelect(null)

    await fetch(`/api/conversations/${cid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  }

  return (
    <aside
      style={{
        width: 260, minWidth: 260, height: '100%', flexShrink: 0,
        background: 'rgba(8, 10, 22, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        zIndex: 20,
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => onSelect(null)}
          onMouseEnter={() => setNewHovered(true)}
          onMouseLeave={() => setNewHovered(false)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: newHovered
              ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.14))'
              : 'rgba(255,255,255,0.04)',
            border: newHovered ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          <MessageSquarePlus size={16} />
          <span>Nova conversa</span>
        </button>
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        {loading && (
          <div style={{ padding: 14, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
            Carregando...
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div style={{ padding: '24px 14px', fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
            Suas conversas aparecerão aqui.
          </div>
        )}

        {conversations.map(conv => {
          const active = conv.id === activeCid
          const hovered = conv.id === hoveredId
          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(139,92,246,0.15)' : (hovered ? 'rgba(255,255,255,0.04)' : 'transparent'),
                border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                color: active ? '#fff' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {conv.title || 'Conversa sem título'}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                  {relativeTime(conv.updated_at)}
                </div>
              </div>

              {hovered && (
                <button
                  onClick={(e) => handleDelete(conv.id, e)}
                  aria-label="Excluir conversa"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 26, height: 26, borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#fca5a5' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8' }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
