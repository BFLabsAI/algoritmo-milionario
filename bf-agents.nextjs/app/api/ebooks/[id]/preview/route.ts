import { createClient } from '@/lib/supabase/server'
import { getGenerationStatus } from '@/lib/gamma'

function filenameFromTitle(title: string, fallback: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || fallback}.pdf`
}

function findPdfUrl(source: string) {
  const candidates = [
    /https?:\/\/[^"'`\s<>]+\.pdf[^"'`\s<>]*/i,
    /https?:\/\/[^"'`\s<>]+\/[^"'`\s<>]*export[^"'`\s<>]*/i,
    /https?:\/\/[^"'`\s<>]+\/[^"'`\s<>]*download[^"'`\s<>]*/i,
  ]

  for (const pattern of candidates) {
    const match = source.match(pattern)
    if (match?.[0]) return match[0].replace(/&amp;/g, '&')
  }

  const direct = source.match(/"([^"]+\.pdf[^"]*)"/i)?.[1] ?? source.match(/'([^']+\.pdf[^']*)'/i)?.[1] ?? null
  return direct?.replace(/&amp;/g, '&') ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: ebook, error } = await supabase
    .from('generated_ebooks_algoritmo_milionario')
    .select('id, status, storage_path, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !ebook) return new Response('Not found', { status: 404 })

  let documentUrl = ebook.storage_path?.startsWith('http') ? ebook.storage_path : null

  if (!documentUrl && ebook.storage_path?.startsWith('gamma:')) {
    const gammaId = ebook.storage_path.replace('gamma:', '')

    try {
      const gammaStatus = await getGenerationStatus(gammaId)
      documentUrl = gammaStatus.exportUrl ?? gammaStatus.gammaUrl ?? null

      if (documentUrl) {
        await supabase
          .from('generated_ebooks_algoritmo_milionario')
          .update({ storage_path: documentUrl })
          .eq('id', id)
      }
    } catch {
      return new Response('Preview unavailable', { status: 502 })
    }
  }

  if (!documentUrl) return new Response('Preview unavailable', { status: 404 })

  let upstream = await fetch(documentUrl, {
    headers: {
      Accept: 'application/pdf,application/octet-stream,text/html;q=0.9,*/*;q=0.8',
    },
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('Preview unavailable', { status: upstream.status || 502 })
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/pdf'
  if (contentType.includes('text/html')) {
    const html = await upstream.text()
    const pdfUrl = findPdfUrl(html)

    if (!pdfUrl) {
      return new Response('Preview unavailable', { status: 415 })
    }

    upstream = await fetch(pdfUrl, {
      headers: { Accept: 'application/pdf,application/octet-stream,*/*;q=0.8' },
    })

    if (!upstream.ok || !upstream.body) {
      return new Response('Preview unavailable', { status: upstream.status || 502 })
    }
  }

  const headers = new Headers()
  const finalContentType = upstream.headers.get('content-type') ?? 'application/pdf'
  headers.set('Content-Type', finalContentType)
  headers.set('Cache-Control', 'private, no-store, max-age=0')
  headers.set('Content-Disposition', `inline; filename="${filenameFromTitle(ebook.title, ebook.id)}"`)

  const contentLength = upstream.headers.get('content-length')
  if (contentLength) headers.set('Content-Length', contentLength)

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}
