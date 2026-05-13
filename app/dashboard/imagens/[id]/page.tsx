import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { resolveImageUrl } from '@/lib/b2'

export default async function ImageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: image } = await supabase
    .from('generated_images_algoritmo_milionario')
    .select('*')
    .eq('id', id)
    .single()

  if (!image) notFound()

  const imageUrl = await resolveImageUrl(image.storage_path)

  return (
    <div style={{ padding: '40px', maxWidth: 900, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Imagem Gerada</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {new Date(image.created_at).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{
          borderRadius: 12, overflow: 'hidden',
          background: 'var(--surface-3)',
          position: 'relative', width: '100%', minHeight: 360,
        }}>
          <Image
            src={imageUrl}
            alt={image.prompt}
            fill
            style={{ objectFit: 'contain' }}
            unoptimized
          />
        </div>

        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Prompt</p>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)', background: 'var(--surface-3)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
            {image.prompt}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {image.model_slug && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Modelo</p>
              <p style={{ fontSize: 14, color: 'var(--text)' }}>{image.model_slug}</p>
            </div>
          )}
          {image.width && image.height && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Dimensões</p>
              <p style={{ fontSize: 14, color: 'var(--text)' }}>{image.width} × {image.height}px</p>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 140 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>Download</p>
            <a
              href={imageUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              Baixar imagem
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
