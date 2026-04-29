'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
  MessagesSquare,
} from 'lucide-react'

const MODELS = [
  { slug: 'million-ai-1.0', label: 'Million AI 1.0', badge: 'Padrão', color: 'var(--accent)' },
  { slug: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', badge: null, color: '#10b981' },
  { slug: 'openai/gpt-4o', label: 'GPT-4o', badge: 'Pro', color: '#6366f1' },
  { slug: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet', badge: 'Pro', color: '#f59e0b' },
  { slug: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: 'Pro', color: '#0ea5e9' },
  { slug: 'deepseek/deepseek-v3', label: 'DeepSeek V3', badge: 'Pro', color: '#8b5cf6' },
]

type Message = { role: 'user' | 'assistant'; content: string; id: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('million-ai-1.0')
  const [convId, setConvId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '48px'; // reset first
    const newHeight = Math.max(48, Math.min(textarea.scrollHeight, 150));
    textarea.style.height = `${newHeight}px`;
  }, []);

  const handleSend = useCallback(async (overrideMsg?: string | React.MouseEvent) => {
    const isStringOverride = typeof overrideMsg === 'string';
    const msg = (isStringOverride ? overrideMsg : input).trim()
    if (!msg || loading) return
    if (!isStringOverride) setInput(''); 
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = '48px';
    
    const userMsg: Message = { role: 'user', content: msg, id: Date.now().toString() }
    const aiMsg: Message = { role: 'assistant', content: '', id: (Date.now() + 1).toString() }
    setMessages(prev => [...prev, userMsg, aiMsg])
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: msg, conversationId: convId, model }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Erro na resposta da IA')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        if (chunk.includes('__CONV_ID__')) {
          const match = chunk.match(/__CONV_ID__([\w-]+)__/)
          if (match) { setConvId(match[1]); buffer += chunk.replace(/__CONV_ID__[\w-]+__\n/, '') }
          else buffer += chunk
        } else {
          buffer += chunk
        }

        setMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: buffer } : m
        ))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }, [input, loading, convId, model])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSend(); 
    }
  }

  function QuickAction({ icon, label, prompt }: { icon: React.ReactNode, label: string, prompt: string }) {
    return (
      <button
        onClick={() => handleSend(prompt)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          borderRadius: 9999, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.5)', color: '#d4d4d4', cursor: 'pointer',
          fontSize: 13, transition: 'all 0.2s', backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.color = '#d4d4d4' }}
      >
        {icon}
        <span>{label}</span>
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/ruixen_moon_2.png')",
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}
    >
      {/* Model Selector Top Bar */}
      <div style={{ width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 12, position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
        <select value={model} onChange={e => setModel(e.target.value)} style={{
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13,
          cursor: 'pointer', outline: 'none',
        }}>
          {MODELS.map(m => (
            <option key={m.slug} value={m.slug}>{m.label}{m.badge ? ` (${m.badge})` : ''}</option>
          ))}
        </select>
        {convId && (
          <button onClick={() => { setMessages([]); setConvId(null) }} style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(10px)'
          }}>+ Nova</button>
        )}
      </div>

      {messages.length === 0 ? (
        <>
          {/* Centered AI Title for Empty State */}
          <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
            <h1 style={{ fontSize: 42, fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)', letterSpacing: '-0.02em' }}>
              Algoritmo Milionário
            </h1>
            <p style={{ marginTop: 12, color: '#e5e5e5', fontSize: 16 }}>
              Construa algo incrível — comece a digitar abaixo.
            </p>
          </div>
          <div style={{ flex: 1 }} />
        </>
      ) : (
        /* Messages Container */
        <div style={{ flex: 1, width: '100%', maxWidth: 800, padding: '80px 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24, zIndex: 5 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0, marginRight: 12, marginTop: 4,
                  background: 'linear-gradient(135deg, #4cc9f0, #3a86ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>AM</div>
              )}
              <div style={{
                maxWidth: '85%', padding: '14px 18px', borderRadius: 16,
                background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(12px)',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: 15, lineHeight: 1.6,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                {msg.content || (msg.role === 'assistant' && loading ? (
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', height: 24 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3a3a3', animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </span>
                ) : '')}
              </div>
            </div>
          ))}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: 14, backdropFilter: 'blur(8px)', alignSelf: 'center' }}>
              ⚠️ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input Box Section */}
      <div style={{ width: '100%', maxWidth: 800, padding: '0 16px', marginBottom: messages.length === 0 ? '15vh' : '24px', zIndex: 10 }}>
        <div style={{
          position: 'relative', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
          borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustHeight() }}
            onKeyDown={handleKeyDown}
            placeholder="Digite seu prompt ou comando..."
            style={{
              width: '100%', padding: '16px', border: 'none', background: 'transparent',
              color: '#fff', fontSize: 15, resize: 'none', outline: 'none',
              minHeight: 48, maxHeight: 150, overflowY: 'auto'
            }}
          />

          {/* Footer Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
            <button style={{
              background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer',
              padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a3a3a3' }}
            >
              <Paperclip size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px', borderRadius: '10px', transition: 'all 0.2s', border: 'none',
                  background: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: input.trim() && !loading ? '#000' : 'rgba(255,255,255,0.3)',
                  cursor: input.trim() && !loading ? 'pointer' : 'not-allowed'
                }}
              >
                <ArrowUpIcon size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions (only show when empty) */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>✍️</span>} 
              label="Copywriter VSL" 
              prompt="Aja como um Expert Copywriter focado em VSL (Video Sales Letter). Estou começando um novo projeto e preciso de um script de alta conversão. Por onde começamos?" 
            />
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>📣</span>} 
              label="Gestor de Tráfego" 
              prompt="Aja como um Gestor de Tráfego de elite. Preciso de uma estratégia validada para Facebook Ads focada em leads qualificados. Quais as melhores segmentações hoje?" 
            />
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>💰</span>} 
              label="Especialista em Vendas" 
              prompt="Aja como um Fechador (Closer) especialista em High Ticket. Como contornar objeções de preço em uma call de vendas 1 a 1?" 
            />
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>📧</span>} 
              label="E-mail Marketing" 
              prompt="Aja como um Especialista em E-mail Marketing. Preciso de uma sequência de 5 e-mails para nutrir leads antes de um grande lançamento. Pode estruturar para mim?" 
            />
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>🎬</span>} 
              label="Estrategista de Reels" 
              prompt="Aja como um Estrategista Viral de Instagram/Tiktok. Me dê 3 ideias de scripts de Reels (com gancho e CTA) para viralizar um perfil de negócios." 
            />
            <QuickAction 
              icon={<span style={{ fontSize: 16 }}>⭐</span>} 
              label="Estrategista Geral" 
              prompt="Aja como um Estrategista Digital (CMO). Quero lançar um infoproduto novo no mercado. Qual o funil de vendas mais indicado para começar validando o produto?" 
            />
          </div>
        )}
      </div>
    </div>
  )
}
