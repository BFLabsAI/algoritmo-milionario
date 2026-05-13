'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import ChatHistorySidebar from '@/components/ChatHistorySidebar'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowUpIcon,
  Paperclip,
  Copy,
  Check,
  ChevronDown,
  X,
} from 'lucide-react'

const MODELS = [
  { slug: 'scale-ai-pro', label: 'Scale AI PRO', badge: 'Padrão', color: '#8b5cf6' },
  { slug: 'gemini-3',        label: 'Gemini 3',       badge: 'Rápido', color: '#0ea5e9' },
  { slug: 'grok-4.1-fast',  label: 'Grok 4.1 Fast',  badge: 'Novo',   color: '#10b981' },
  { slug: 'gpt-5.4',        label: 'GPT 5.4',         badge: 'Pro',    color: '#8b5cf6' },
]

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string }
type Agent = { id: string; name: string; category: string | null; default_model: string }

const CATEGORY_ICONS: Record<string, string> = {
  geral: '⭐', copywriting: '✍️', ads: '📣', email: '📧', reels: '🎬', vendas: '💰',
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}, ${alpha})`
}

function uid() { return Math.random().toString(36).slice(2) }

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const initialAgentId = searchParams.get('agentId')
  const initialModelFromUrl = searchParams.get('model')
  const cidFromUrl = searchParams.get('cid')

  const [model, setModel] = useState(
    initialModelFromUrl && MODELS.some(m => m.slug === initialModelFromUrl)
      ? initialModelFromUrl
      : 'scale-ai-pro'
  )
  const [agentId, setAgentId] = useState<string | null>(initialAgentId)
  const [agents, setAgents] = useState<Agent[]>([])
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const [convId, setConvId] = useState<string | null>(cidFromUrl)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [historyKey, setHistoryKey] = useState(0)
  const [loadingConv, setLoadingConv] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const [sendHovered, setSendHovered] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const convIdRef = useRef<string | null>(null)
  const agentIdRef = useRef<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep refs in sync for use inside async callbacks
  useEffect(() => { convIdRef.current = convId }, [convId])
  useEffect(() => { agentIdRef.current = agentId }, [agentId])

  // Load agents list once
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('agents_algoritmo_milionario')
      .select('id, name, category, default_model')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => { if (data) setAgents(data as Agent[]) })
  }, [])

  // Load conversation messages when cid in URL changes
  useEffect(() => {
    if (!cidFromUrl) return
    let cancelled = false

    ;(async () => {
      setLoadingConv(true)
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setLoadingConv(false); return }

      try {
        const res = await fetch(`/api/conversations/${cidFromUrl}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { setLoadingConv(false); return }
        const json = await res.json()
        if (cancelled) return

        const loaded: ChatMessage[] = (json.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }))
        setMessages(loaded)
        setConvId(cidFromUrl)
        convIdRef.current = cidFromUrl
        if (json.conversation?.model_slug && MODELS.some(m => m.slug === json.conversation.model_slug)) {
          setModel(json.conversation.model_slug)
        }
        if (json.conversation?.agent_id) {
          setAgentId(json.conversation.agent_id)
        }
      } finally {
        if (!cancelled) setLoadingConv(false)
      }
    })()

    return () => { cancelled = true }
  }, [cidFromUrl])

  // Sidebar selection handler — updates URL via shallow nav
  const handleSelectConversation = useCallback((cid: string | null) => {
    abortRef.current?.abort()
    if (cid === null) {
      // New chat
      router.replace(pathname)
      setMessages([])
      setConvId(null)
      convIdRef.current = null
      setError(null)
      return
    }
    if (cid === convIdRef.current) return
    router.replace(`${pathname}?cid=${cid}`)
  }, [router, pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!agentDropdownOpen) return
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAgentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [agentDropdownOpen])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const selectedAgent = agents.find(a => a.id === agentId) ?? null

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = '48px'
    el.style.height = `${Math.max(48, Math.min(el.scrollHeight, 150))}px`
  }, [])

  const handleSend = useCallback(async (overrideMsg?: string | React.MouseEvent) => {
    const text = (typeof overrideMsg === 'string' ? overrideMsg : inputValue).trim()
    if (!text || streaming) return

    setError(null)
    setInputValue('')
    if (textareaRef.current) textareaRef.current.style.height = '48px'

    const userMsgId = uid()
    const asstMsgId = uid()
    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', content: text },
      { id: asstMsgId, role: 'assistant', content: '' },
    ])
    setStreaming(true)

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token ?? ''

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          model,
          ...(convIdRef.current ? { conversationId: convIdRef.current } : {}),
          ...(agentIdRef.current ? { agentId: agentIdRef.current } : {}),
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || `Erro ${res.status}`)
      }

      const newConvId = res.headers.get('X-Conversation-Id')
      const wasNewConv = !convIdRef.current
      if (newConvId) {
        convIdRef.current = newConvId
        setConvId(newConvId)
        if (wasNewConv) {
          // Reflect in URL so refresh keeps the conversation, and refresh sidebar list
          router.replace(`${pathname}?cid=${newConvId}`)
        }
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev =>
          prev.map(m => m.id === asstMsgId ? { ...m, content: accumulated } : m)
        )
      }

      // If the assistant message is still empty after streaming, clean it up
      setMessages(prev =>
        prev.filter(m => m.id !== asstMsgId || m.content.length > 0)
      )
      // Refresh sidebar history (titles update, ordering changes)
      setHistoryKey(k => k + 1)
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      const msg = (err as Error).message ?? 'Erro desconhecido'
      setError(msg)
      // Remove the empty assistant placeholder
      setMessages(prev => prev.filter(m => m.id !== asstMsgId))
    } finally {
      setStreaming(false)
      abortRef.current = null
    }
  }, [inputValue, streaming, model, pathname, router])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleCopy(msg: ChatMessage) {
    navigator.clipboard.writeText(msg.content)
    setCopiedId(msg.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function handleNewChat() {
    abortRef.current?.abort()
    setMessages([])
    setConvId(null)
    convIdRef.current = null
    setError(null)
    if (cidFromUrl) router.replace(pathname)
  }

  const sendActive = Boolean(inputValue.trim()) && !streaming

  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative' }}>
      <ChatHistorySidebar
        activeCid={convId}
        onSelect={handleSelectConversation}
        refreshKey={historyKey}
      />
    <div
      style={{
        position: 'relative', flex: 1, height: '100%',
        background: `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 80%, #0d2137 0%, transparent 50%),
                     #080810`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div className="aurora-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {loadingConv && (
        <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 30, padding: '6px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, backdropFilter: 'blur(8px)' }}>
          Carregando conversa...
        </div>
      )}

      {/* Top Bar */}
      <div style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0, flex: 1 }}>
        <div className="toolbar-rail" style={{ flex: 1, justifyContent: 'flex-end', padding: '4px 2px' }}>
          {MODELS.map(m => {
            const active = model === m.slug
            return (
              <button
                key={m.slug}
                onClick={() => setModel(m.slug)}
                style={{
                  display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
                  padding: '6px 14px', borderRadius: 9999,
                  background: active ? hexToRgba(m.color, 0.15) : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${active ? m.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: active ? `0 0 16px ${hexToRgba(m.color, 0.25)}` : 'none',
                  backdropFilter: 'blur(8px)',
                  color: active ? '#fff' : '#a3a3a3',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{m.label}</span>
                {m.badge && (
                  <span style={{ fontSize: 10, marginLeft: 4, color: active ? m.color : '#666', fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                    {m.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        {convId && (
          <button
            onClick={handleNewChat}
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 9999, cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(10px)', whiteSpace: 'nowrap' }}
          >
            + Nova
          </button>
        )}
        </div>
      </div>

      {messages.length === 0 ? (
        <>
          <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, paddingTop: 70 }}>
            <img
              src="/logo-full.webp"
              alt="Algoritmo Milionário"
              style={{ width: 300, height: 'auto', opacity: 0.92 }}
            />
          </div>
        </>
      ) : (
        <div style={{ flex: 1, width: '100%', maxWidth: 800, padding: '80px 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, zIndex: 5 }}>
          {messages.map(msg => {
            const isAssistant = msg.role === 'assistant'
            const showCopy = isAssistant && msg.content.length > 0
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {isAssistant && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginRight: 12, marginTop: 4,
                    background: 'linear-gradient(135deg, #4cc9f0, #3a86ff)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}>AM</div>
                )}
                <div
                  onMouseEnter={() => showCopy && setHoveredMsgId(msg.id)}
                  onMouseLeave={() => showCopy && setHoveredMsgId(prev => prev === msg.id ? null : prev)}
                  style={{
                    position: 'relative',
                    maxWidth: '85%', minWidth: 0, padding: '14px 18px', borderRadius: 16,
                    background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: 15, lineHeight: 1.6,
                    wordBreak: 'break-word', overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    animation: 'slideUpFade 0.25s ease-out',
                  }}
                >
                  {msg.content ? (
                    isAssistant
                      ? <MarkdownRenderer content={msg.content} />
                      : <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>
                  ) : (
                    isAssistant && streaming ? (
                      <span style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'block', width: 100, height: 3, borderRadius: 9999,
                          background: 'linear-gradient(90deg, transparent 0%, #3b82f6 40%, #8b5cf6 60%, transparent 100%)',
                          backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite',
                        }} />
                      </span>
                    ) : null
                  )}

                  {showCopy && (
                    <button
                      onClick={() => handleCopy(msg)}
                      aria-label="Copiar mensagem"
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        opacity: hoveredMsgId === msg.id ? 1 : 0,
                        transition: 'opacity 0.15s ease, background 0.15s ease',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: copiedId === msg.id ? '#10b981' : '#a3a3a3',
                        borderRadius: 8, padding: 6, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    >
                      {copiedId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: 14, backdropFilter: 'blur(8px)', alignSelf: 'center' }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Box */}
      <div style={{ width: '100%', maxWidth: 800, padding: '0 16px', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 12px))', marginBottom: messages.length === 0 ? 'clamp(40px, 10vh, 80px)' : 0, zIndex: 10 }}>
        {/* Agent Selector — above input */}
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase', paddingLeft: 4 }}>
            Selecione seu agente
          </span>
          <button
            onClick={() => setAgentDropdownOpen(o => !o)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 12,
              background: selectedAgent ? 'rgba(139, 92, 246, 0.12)' : 'rgba(0,0,0,0.5)',
              border: `1px solid ${selectedAgent ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: selectedAgent ? '0 0 16px rgba(139, 92, 246, 0.2)' : 'none',
              backdropFilter: 'blur(8px)',
              color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14 }}>
              {selectedAgent ? (CATEGORY_ICONS[selectedAgent.category ?? 'geral'] ?? '🤖') : '🧠'}
            </span>
            <span>{selectedAgent ? selectedAgent.name : 'Sem agente'}</span>
            {selectedAgent && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Remover agente"
                onClick={(e) => {
                  e.stopPropagation()
                  setAgentId(null)
                  setAgentDropdownOpen(false)
                  handleNewChat()
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: 6, marginLeft: 2,
                  background: 'rgba(255,255,255,0.08)', color: '#cbd5e1',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#cbd5e1' }}
              >
                <X size={12} />
              </span>
            )}
            <ChevronDown size={14} style={{ color: '#94a3b8', transition: 'transform 0.2s', transform: agentDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>

          {agentDropdownOpen && (
            <div
              style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
                minWidth: 'min(280px, calc(100vw - 32px))', maxHeight: 380, overflowY: 'auto',
                background: 'rgba(10, 12, 24, 0.95)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)', padding: 6, zIndex: 20,
                animation: 'slideUpFade 0.18s ease-out',
              }}
            >
              <button
                onClick={() => { setAgentId(null); setAgentDropdownOpen(false); handleNewChat() }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: !agentId ? 'rgba(255,255,255,0.06)' : 'transparent',
                  border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (agentId) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (agentId) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16 }}>🧠</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 500 }}>Sem agente</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Modo livre, sem prompt especializado</span>
                </div>
                {!agentId && <Check size={14} style={{ marginLeft: 'auto', color: '#10b981' }} />}
              </button>

              {agents.length > 0 && <div style={{ height: 1, margin: '4px 6px', background: 'rgba(255,255,255,0.06)' }} />}

              {agents.map(a => {
                const active = agentId === a.id
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAgentId(a.id)
                      if (a.default_model && MODELS.some(m => m.slug === a.default_model)) setModel(a.default_model)
                      setAgentDropdownOpen(false)
                      handleNewChat()
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 8,
                      background: active ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[a.category ?? 'geral'] ?? '🤖'}</span>
                    <span style={{ fontWeight: 500, flex: 1 }}>{a.name}</span>
                    {active && <Check size={14} style={{ color: '#a78bfa' }} />}
                  </button>
                )
              })}

              {agents.length === 0 && (
                <div style={{ padding: '12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                  Nenhum agente disponível
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          position: 'relative', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
          borderRadius: 16,
          border: inputFocused ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: inputFocused ? '0 0 0 3px rgba(59, 130, 246, 0.08), 0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Digite seu prompt ou comando..."
            style={{
              width: '100%', padding: '16px', border: 'none', background: 'transparent',
              color: '#fff', fontSize: 15, resize: 'none', outline: 'none',
              minHeight: 48, maxHeight: 150, overflowY: 'auto',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
            <button
              aria-label="Anexar arquivo"
              style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a3a3a3' }}
            >
              <Paperclip size={18} />
            </button>

            <button
              onClick={() => handleSend()}
              disabled={!sendActive}
              aria-label="Enviar mensagem"
              onMouseEnter={() => setSendHovered(true)}
              onMouseLeave={() => setSendHovered(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 44, height: 44, padding: '8px', borderRadius: '10px', border: 'none',
                background: sendActive ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' : 'rgba(255,255,255,0.06)',
                color: sendActive ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: sendActive ? 'pointer' : 'not-allowed',
                boxShadow: sendActive ? (sendHovered ? '0 0 28px rgba(59,130,246,0.5)' : '0 0 20px rgba(59,130,246,0.35)') : 'none',
                transform: sendActive && sendHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowUpIcon size={18} strokeWidth={3} />
            </button>
          </div>
        </div>

      </div>
    </div>
    </div>
  )
}
