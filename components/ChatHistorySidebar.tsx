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
  isOpen?: boolean
  onClose?: () => void
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

export default function ChatHistorySidebar({ activeCid, onSelect, refreshKey, isOpen = false, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

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
      className={`chat-history-sidebar${isOpen ? ' chat-history-open' : ''}`}
      aria-label="Histórico de conversas"
    >
      <style>{`
        .chat-history-sidebar {
          width: 260px;
          min-width: 260px;
          height: 100%;
          flex-shrink: 0;
          background: rgba(8, 10, 22, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          z-index: 20;
          transition: transform 0.3s ease;
        }
        @media (max-width: 767px) {
          .chat-history-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100dvh;
            z-index: 50;
            transform: translateX(-100%);
          }
          .chat-history-sidebar.chat-history-open {
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => { onSelect(null); onClose?.() }}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.18s ease',
            minHeight: 44,
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
          return (
            <div
              key={conv.id}
              onClick={() => { onSelect(conv.id); onClose?.() }}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 10px', borderRadius: 8, marginBottom: 2,
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                border: active ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
                color: active ? '#fff' : '#cbd5e1',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                minHeight: 44,
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
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {relativeTime(conv.updated_at)}
                </div>
              </div>

              {/* Delete button — always visible on touch, not hover-only */}
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                aria-label="Excluir conversa"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 44, borderRadius: 8,
                  background: 'transparent',
                  border: '1px solid transparent',
                  color: '#64748b', cursor: 'pointer', flexShrink: 0,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onFocus={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
                onBlur={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
