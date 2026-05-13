// app/api/offer-analysis/route.ts — GET: list user's analyses | POST: create analysis
import { createAdminClient } from '@/lib/supabase/server'
import { generateOfferAnalysis } from '@/lib/ai-generators'

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function extractVisibleText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')

  const text = withoutScripts
    .replace(/<\/(p|div|section|article|header|footer|main|aside|li|h[1-6]|tr|td|th)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

  return text
}

async function fetchPageText(sourceUrl: string) {
  const response = await fetch(sourceUrl, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; AlgoritmoMilionarioAnalyzer/1.0)',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Falha ao acessar a URL (${response.status})`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new Error('A URL não retornou uma página HTML válida')
  }

  const html = await response.text()
  const text = extractVisibleText(html)

  if (text.length < 100) {
    throw new Error('Não foi possível extrair texto suficiente da página')
  }

  return text
}

export async function GET(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('offer_analyses_algoritmo_milionario')
    .select('id, source_url, analysis, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return new Response(error.message, { status: 500 })

  // Map to include a 200-char summary preview extracted from analysis->summary
  const analyses = (data ?? []).map((row) => {
    const analysisObj = row.analysis as Record<string, unknown> | null
    const summary = typeof analysisObj?.summary === 'string'
      ? analysisObj.summary.slice(0, 200)
      : null

    return {
      id: row.id,
      source_url: row.source_url,
      preview: summary,
      created_at: row.created_at,
    }
  })

  return Response.json({ analyses })
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  let body: { sourceUrl: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const { sourceUrl } = body
  if (!sourceUrl || !sourceUrl.trim()) {
    return new Response('sourceUrl is required', { status: 400 })
  }

  const normalizedUrl = sourceUrl.trim()
  if (!isValidHttpUrl(normalizedUrl)) {
    return new Response('sourceUrl must be a valid http(s) URL', { status: 400 })
  }

  let sourceText: string
  try {
    sourceText = await fetchPageText(normalizedUrl)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to extract page text'
    return new Response(`URL extraction error: ${message}`, { status: 500 })
  }

  // Generate the AI offer analysis
  let aiResult
  try {
    aiResult = await generateOfferAnalysis({
      sourceText,
      sourceUrl: normalizedUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed'
    return new Response(`AI generation error: ${message}`, { status: 500 })
  }

  // Insert into offer_analyses table
  const { data: analysis, error: insertError } = await supabase
    .from('offer_analyses_algoritmo_milionario')
    .insert({
      user_id: user.id,
      source_url: normalizedUrl,
      source_text: sourceText,
      analysis: aiResult,
      scores: aiResult.scores,
      modeling_suggestions: aiResult.modeling_suggestions,
    })
    .select('*')
    .single()

  if (insertError || !analysis) {
    return new Response(insertError?.message ?? 'Failed to create analysis', { status: 500 })
  }

  return Response.json({ analysis }, { status: 201 })
}
