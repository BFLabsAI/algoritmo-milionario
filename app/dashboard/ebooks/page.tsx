'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import EbookGenerator from '@/components/EbookGenerator'
import EbookGallery, { type EbookRow } from '@/components/EbookGallery'

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<EbookRow[]>([])
  const pollingRefs = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  function updateEbook(id: string, patch: Partial<EbookRow>) {
    setEbooks(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  const startPollingFor = useCallback(async (ids: string[]) => {
    const idsToStart = ids.filter(id => !pollingRefs.current.has(id))
    if (!idsToStart.length) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const token = session.access_token

    for (const id of idsToStart) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ebooks/${id}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return
          const data = await res.json() as { status: string; gamma_url: string | null; export_url: string | null }
          if (data.status === 'done' || data.status === 'error') {
            clearInterval(interval)
            pollingRefs.current.delete(id)
            updateEbook(id, {
              status: data.status,
              storage_path: data.export_url ?? data.gamma_url ?? undefined,
            })
          }
        } catch { /* keep polling */ }
      }, 2000)
      pollingRefs.current.set(id, interval)
    }
  }, [])

  const loadEbooks = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('generated_ebooks_algoritmo_milionario')
      .select('id, title, status, created_at, theme, storage_path')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    const rows = data ?? []
    setEbooks(rows)
    const generatingIds = rows.filter(e => e.status === 'generating').map(e => e.id)
    if (generatingIds.length) startPollingFor(generatingIds)
  }, [startPollingFor])

  useEffect(() => {
    loadEbooks()
    return () => { pollingRefs.current.forEach(clearInterval) }
  }, [loadEbooks])

  function handleCreated(record: EbookRow) {
    setEbooks(prev => {
      const exists = prev.find(e => e.id === record.id)
      if (exists) return prev.map(e => e.id === record.id ? { ...e, ...record } : e)
      return [record, ...prev]
    })
    if (record.status === 'generating') startPollingFor([record.id])
  }

  return (
    <div
      style={{
        position: 'relative', width: '100%', minHeight: '100%',
        background: `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 80%, #0d2137 0%, transparent 50%),
                     #080810`,
      }}
    >
      <div className="aurora-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px 40px 60px' }}>

        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Gerador de Ebooks
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Crie ebooks completos prontos para vender — conteúdo, layout visual e PDF gerados com IA.
          </p>
        </div>

        <div style={{ marginBottom: 48 }}>
          <EbookGenerator onCreated={handleCreated} />
        </div>

        <EbookGallery ebooks={ebooks} />
      </div>
    </div>
  )
}
