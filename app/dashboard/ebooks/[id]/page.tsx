import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGenerationStatus } from '@/lib/gamma'
import EbookViewer from '@/components/EbookViewer'

export default async function EbookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ebook } = await supabase
    .from('generated_ebooks_algoritmo_milionario')
    .select('id, title, status, storage_path, page_count, theme, created_at')
    .eq('id', id)
    .single()

  if (!ebook) notFound()

  let gammaUrl = ebook.storage_path?.startsWith('http') ? ebook.storage_path : null

  if (!gammaUrl && ebook.storage_path?.startsWith('gamma:')) {
    try {
      const gammaId = ebook.storage_path.replace('gamma:', '')
      const gammaStatus = await getGenerationStatus(gammaId)
      gammaUrl = gammaStatus.exportUrl ?? gammaStatus.gammaUrl ?? null
    } catch {
      // fall back to the stored state; the viewer will show the safe completion card
    }
  }

  return (
    <div
      style={{
        position: 'relative', width: '100%', minHeight: '100%',
        background: `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                     #080810`,
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, padding: '32px 40px 60px' }}>
        <EbookViewer
          id={ebook.id}
          title={ebook.title}
          status={ebook.status}
          gammaUrl={gammaUrl}
          pageCount={ebook.page_count}
          theme={ebook.theme}
          createdAt={ebook.created_at}
        />
      </div>
    </div>
  )
}
