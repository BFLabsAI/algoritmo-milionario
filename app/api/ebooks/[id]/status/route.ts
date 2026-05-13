import { createAdminClient } from '@/lib/supabase/server'
import { getGenerationStatus } from '@/lib/gamma'

const STALE_GENERATION_MS = 30 * 60 * 1000

function isStale(createdAt: string | null | undefined) {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  return Date.now() - created > STALE_GENERATION_MS
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: ebook, error } = await supabase
    .from('generated_ebooks_algoritmo_milionario')
    .select('id, status, storage_path, title, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !ebook) return new Response('Not found', { status: 404 })

  // Already resolved with a real URL — return current state.
  // Older records may still store `gamma:<id>` even when marked done, so fall through and resolve them.
  if ((ebook.status === 'done' || ebook.status === 'error') && !ebook.storage_path?.startsWith('gamma:')) {
    return Response.json({
      status:     ebook.status,
      gamma_url:  ebook.status === 'done' ? ebook.storage_path : null,
      export_url: ebook.status === 'done' ? ebook.storage_path : null,
    })
  }

  // Still pending/generating — poll Gamma
  if (ebook.storage_path?.startsWith('gamma:')) {
    const gammaId = ebook.storage_path.replace('gamma:', '')

    let gammaStatus: Awaited<ReturnType<typeof getGenerationStatus>>
    try {
      gammaStatus = await getGenerationStatus(gammaId)
    } catch {
      if (isStale(ebook.created_at)) {
        await supabase
          .from('generated_ebooks_algoritmo_milionario')
          .update({ status: 'error' })
          .eq('id', id)
        return Response.json({ status: 'error', gamma_url: null, export_url: null })
      }

      return Response.json({ status: 'generating', gamma_url: null, export_url: null })
    }

    if (gammaStatus.status === 'completed') {
      const gammaUrl  = gammaStatus.gammaUrl  ?? null
      const exportUrl = gammaStatus.exportUrl ?? null
      const resolvedUrl = exportUrl ?? gammaUrl ?? ebook.storage_path

      await supabase
        .from('generated_ebooks_algoritmo_milionario')
        .update({ status: 'done', storage_path: resolvedUrl })
        .eq('id', id)

      return Response.json({ status: 'done', gamma_url: gammaUrl, export_url: exportUrl ?? gammaUrl })
    }

    if (gammaStatus.status === 'failed') {
      await supabase
        .from('generated_ebooks_algoritmo_milionario')
        .update({ status: 'error' })
        .eq('id', id)

      return Response.json({ status: 'error', gamma_url: null, export_url: null })
    }

    if (gammaStatus.status === 'pending' && isStale(ebook.created_at)) {
      await supabase
        .from('generated_ebooks_algoritmo_milionario')
        .update({ status: 'error' })
        .eq('id', id)

      return Response.json({ status: 'error', gamma_url: null, export_url: null })
    }
  }

  return Response.json({ status: ebook.status, gamma_url: null, export_url: null })
}
