'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { X, Download, ZoomIn } from 'lucide-react'

type GalleryImage = { id: string; prompt: string; imageUrl: string }

function ImageModal({ img, onClose }: { img: GalleryImage; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(img.imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `algoritmo-milionario-${img.id}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab so user can save manually
      window.open(img.imageUrl, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visualizar imagem"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 24,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal"
        style={{
          position: 'relative',
          background: 'rgba(10,12,22,0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.7px',
          }}>
            Imagem Gerada
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 44, height: 44, borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(239,68,68,0.15)'; el.style.color = '#fca5a5' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.06)'; el.style.color = '#94a3b8' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxHeight: '60dvh',
          minHeight: 200,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <Image
            src={img.imageUrl}
            alt={img.prompt}
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'wrap',
        }}>
          <p style={{
            flex: 1, fontSize: 12.5, color: '#64748b', lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {img.prompt}
          </p>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 18px', borderRadius: 10,
              background: downloading
                ? 'rgba(59,130,246,0.08)'
                : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.18) 100%)',
              border: '1px solid rgba(139,92,246,0.4)',
              boxShadow: '0 0 20px rgba(59,130,246,0.15)',
              color: downloading ? '#64748b' : '#a5b4fc',
              fontSize: 13, fontWeight: 600, cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.18s ease',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (downloading) return
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = '0 0 28px rgba(59,130,246,0.35)'
              el.style.color = '#fff'
            }}
            onMouseLeave={e => {
              if (downloading) return
              const el = e.currentTarget as HTMLElement
              el.style.boxShadow = '0 0 20px rgba(59,130,246,0.15)'
              el.style.color = '#a5b4fc'
            }}
          >
            <Download size={15} strokeWidth={2.5} />
            {downloading ? 'Baixando…' : 'Download'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GalleryCard({ img, onClick }: { img: GalleryImage; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      aria-label={`Visualizar: ${img.prompt}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', background: 'none', border: 'none',
        padding: 0, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div
        style={{
          borderRadius: 16, overflow: 'hidden',
          background: 'rgb(14,16,28)',
          border: `1px solid ${hovered ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: hovered ? '0 12px 32px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.4)',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: 'rgba(0,0,0,0.3)' }}>
          <Image src={img.imageUrl} alt={img.prompt} fill style={{ objectFit: 'cover' }} unoptimized />
          {/* Hover overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.18s ease',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ZoomIn size={20} color="#fff" />
            </div>
          </div>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <p style={{
            fontSize: 11, color: '#64748b',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4,
          }}>
            {img.prompt}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState<GalleryImage | null>(null)

  const handleClose = useCallback(() => setSelected(null), [])

  if (!images.length) return null
  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Suas Imagens
          </h2>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: 12, color: '#475569' }}>{images.length} imagens</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
          {images.map(img => (
            <GalleryCard key={img.id} img={img} onClick={() => setSelected(img)} />
          ))}
        </div>
      </div>

      {selected && <ImageModal img={selected} onClose={handleClose} />}
    </>
  )
}
