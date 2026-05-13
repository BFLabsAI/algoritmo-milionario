'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react'

interface Props {
  id:         string
  title:      string
  status:     string
  gammaUrl:   string | null
  pageCount?: number | null
  theme?:     string | null
  createdAt:  string
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  done:       { label: 'Concluído',  color: '#22c55e' },
  generating: { label: 'Gerando…',   color: '#3b82f6' },
  pending:    { label: 'Aguardando', color: '#f59e0b' },
  error:      { label: 'Erro',       color: '#ef4444' },
}

export default function EbookViewer({ id, title, status: initialStatus, gammaUrl: initialGammaUrl, pageCount, theme, createdAt }: Props) {
  const supabase = createClient()
  const [status, setStatus]     = useState(initialStatus)
  const [gammaUrl, setGammaUrl] = useState(initialGammaUrl)
  const [currentPage, setCurrentPage] = useState(1)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (status === 'done' || status === 'error') return

    async function startPolling() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const token = session.access_token

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/ebooks/${id}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return
          const data = await res.json() as { status: string; gamma_url: string | null }
          if (data.status === 'done' || data.status === 'error') {
            clearInterval(pollRef.current!)
            pollRef.current = null
            setStatus(data.status)
            if (data.gamma_url) setGammaUrl(data.gamma_url)
          }
        } catch { /* keep polling */ }
      }, 2000)
    }

    startPolling()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id, status, supabase])

  const s = STATUS_LABEL[status] ?? STATUS_LABEL['pending']
  const safeUrl = gammaUrl && gammaUrl.startsWith('http') ? gammaUrl : null

  const previewSrc = useMemo(() => {
    if (!safeUrl) return null

    return `/api/ebooks/${id}/preview#page=${currentPage}`
  }, [safeUrl, currentPage])

  const totalPages = pageCount ?? null
  const canGoPrev = currentPage > 1
  const canGoNext = totalPages ? currentPage < totalPages : true

  function goToPage(nextPage: number) {
    if (!totalPages) {
      setCurrentPage(Math.max(1, nextPage))
      return
    }

    setCurrentPage(Math.min(totalPages, Math.max(1, nextPage)))
  }

  function goPrev() {
    goToPage(currentPage - 1)
  }

  function goNext() {
    goToPage(currentPage + 1)
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/ebooks"
          style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          ← Ebooks
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#f1f5f9', marginBottom: 8,
            }}>
              {title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: s.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                {s.label}
              </span>
              {pageCount && (
                <span style={{ fontSize: 13, color: '#64748b' }}>{pageCount} páginas</span>
              )}
              {theme && (
                <span style={{ fontSize: 13, color: '#64748b' }}>{theme}</span>
              )}
              <span style={{ fontSize: 13, color: '#475569' }}>
                {new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {safeUrl && status === 'done' && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)',
                color: '#a5b4fc', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Abrir original ↗
            </a>
          )}
        </div>
      </div>

      {/* Safe completed state */}
      {status === 'done' ? (
        safeUrl && previewSrc ? (
          <div className="ebook-preview-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 290px',
            gap: 24,
            alignItems: 'start',
          }}>
            <section style={{
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(12,14,24,0.98), rgba(8,10,18,0.98))',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 6 }}>
                    Prévia do ebook
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>
                    Use o scroll do preview ou pule direto para uma página.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    fontWeight: 700,
                  }}>
                    Página
                    <input
                      type="number"
                      min={1}
                      max={totalPages ?? undefined}
                      value={currentPage}
                      onChange={(event) => goToPage(Number(event.target.value || 1))}
                      style={{
                        width: 60,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        color: '#f8fafc',
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    />
                    {totalPages ? <span style={{ color: '#94a3b8', fontWeight: 600 }}>/ {totalPages}</span> : null}
                  </label>

                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: canGoPrev ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      color: canGoPrev ? '#e2e8f0' : '#475569',
                      fontSize: 13, fontWeight: 700,
                      cursor: canGoPrev ? 'pointer' : 'not-allowed',
                    }}
                    >
                    <ChevronLeft size={15} />
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canGoNext}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '9px 12px', borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: canGoNext ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                      color: canGoNext ? '#e2e8f0' : '#475569',
                      fontSize: 13, fontWeight: 700,
                      cursor: canGoNext ? 'pointer' : 'not-allowed',
                    }}
                    >
                    Avançar
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                }}>
                  <iframe
                    key={previewSrc}
                    src={previewSrc}
                    title={`${title} - prévia`}
                    style={{
                      width: '100%',
                      height: 'min(84vh, 900px)',
                      display: 'block',
                      border: 0,
                      background: '#fff',
                    }}
                  />
                </div>
              </div>
            </section>

            <aside className="ebook-preview-aside" style={{
              borderRadius: 22,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(180deg, rgba(12,14,24,0.95), rgba(10,12,20,0.98))',
              boxShadow: '0 18px 56px rgba(0,0,0,0.4)',
              padding: 20,
              position: 'sticky',
              top: 24,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(167,139,250,0.12)',
                border: '1px solid rgba(167,139,250,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ddd6fe',
                marginBottom: 16,
              }}>
                <FileText size={24} />
              </div>

              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
                Ebook pronto para leitura
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: '#94a3b8', marginBottom: 18 }}>
                O preview tem rolagem própria. Use o seletor de página se quiser ir direto para uma página específica.
              </p>

              <div style={{
                display: 'grid',
                gap: 10,
                marginBottom: 20,
              }}>
                <div style={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 6 }}>
                    Status
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>
                    {s.label}
                  </div>
                </div>
                {pageCount && (
                  <div style={{
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 6 }}>
                      Páginas
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                      {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
                    </div>
                  </div>
                )}
                {theme && (
                  <div style={{
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 6 }}>
                      Tema
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                      {theme}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {safeUrl && (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px 16px', borderRadius: 12,
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.22), rgba(76,201,240,0.14))',
                      border: '1px solid rgba(167,139,250,0.28)',
                      color: '#f5f3ff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    Abrir em nova aba
                    <ExternalLink size={15} />
                  </a>
                )}
                <Link
                  href="/dashboard/ebooks"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '11px 16px', borderRadius: 12,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Voltar para Ebooks
                </Link>
              </div>
            </aside>
          </div>
        ) : (
          <div style={{
            borderRadius: 18, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(12,14,24,0.98), rgba(8,10,18,0.98))',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            padding: '48px 40px',
            minHeight: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{ maxWidth: 620, textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                margin: '0 auto 18px',
                background: 'rgba(167,139,250,0.10)',
                border: '1px solid rgba(167,139,250,0.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#e9d5ff',
                fontSize: 24,
              }}>
                📘
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 10 }}>
                Ebook pronto
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, marginBottom: 24 }}>
                O conteúdo foi gerado com sucesso, mas este link não permite navegação embutida. Abra em nova aba para ler o arquivo completo.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                {safeUrl && (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: '10px 18px', borderRadius: 10,
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(76,201,240,0.14))',
                      border: '1px solid rgba(167,139,250,0.35)',
                      color: '#e9d5ff', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}
                  >
                    Abrir ebook
                  </a>
                )}
                <Link
                  href="/dashboard/ebooks"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '10px 18px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0', fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Voltar para Ebooks
                </Link>
              </div>
            </div>
          </div>
        )
      ) : status === 'error' ? (
        <div style={{
          borderRadius: 16, border: '1px solid rgba(239,68,68,0.2)',
          background: 'rgba(239,68,68,0.06)', padding: '60px 40px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#f87171', marginBottom: 8 }}>Falha na geração</p>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>Ocorreu um erro ao gerar este ebook. Tente criar um novo.</p>
          <Link
            href="/dashboard/ebooks"
            style={{ fontSize: 13, color: '#a5b4fc', textDecoration: 'none', fontWeight: 600 }}
          >
            ← Voltar para Ebooks
          </Link>
        </div>
      ) : (
        <div style={{
          borderRadius: 16, border: '1px solid rgba(59,130,246,0.15)',
          background: 'rgba(59,130,246,0.04)', padding: '80px 40px',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6',
            animation: 'spin 0.85s linear infinite',
          }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#93c5fd', marginBottom: 6 }}>Gerando seu ebook com IA…</p>
            <p style={{ fontSize: 13, color: '#475569' }}>A Gamma está montando o layout. Isso costuma levar 1–3 minutos.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1080px) {
          .ebook-preview-grid {
            grid-template-columns: 1fr !important;
          }
          .ebook-preview-aside {
            position: static !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  )
}
