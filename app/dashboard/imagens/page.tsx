import { createClient } from '@/lib/supabase/server'
import { resolveImageUrl } from '@/lib/b2'
import ImageGenerator from '@/components/ImageGenerator'
import ImageGallery from '@/components/ImageGallery'

export default async function ImagensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rows } = user
    ? await supabase
        .from('generated_images_algoritmo_milionario')
        .select('id, prompt, storage_path, model_used, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(24)
    : { data: [] }

  const images = await Promise.all(
    (rows ?? []).map(async (img) => ({
      ...img,
      imageUrl: await resolveImageUrl(img.storage_path),
    }))
  )

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

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Gerador de Imagens
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Crie artes, criativos e capas com IA em segundos.
          </p>
        </div>

        {/* Full-width generator */}
        <ImageGenerator />

        <ImageGallery images={images} />
      </div>
    </div>
  )
}
