// app/api/offer-analysis/[id]/route.ts — GET: full analysis | DELETE: delete analysis
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: analysis } = await supabase
    .from('offer_analyses_algoritmo_milionario')
    .select('*')
    .eq('id', id)
    .single()

  if (!analysis || analysis.user_id !== user.id) return new Response('Not found', { status: 404 })

  return Response.json({ analysis })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify ownership
  const { data: analysis } = await supabase
    .from('offer_analyses_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!analysis || analysis.user_id !== user.id) return new Response('Not found', { status: 404 })

  await supabase.from('offer_analyses_algoritmo_milionario').delete().eq('id', id)

  return new Response(null, { status: 204 })
}
