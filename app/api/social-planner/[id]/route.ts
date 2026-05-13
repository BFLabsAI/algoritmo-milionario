// app/api/social-planner/[id]/route.ts — GET: plan + items | PATCH: update plan | DELETE: delete plan
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

  // Verify ownership
  const { data: plan } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .select('*')
    .eq('id', id)
    .single()

  if (!plan || plan.user_id !== user.id) return new Response('Not found', { status: 404 })

  // Fetch all items ordered by day_number ASC, slot_number ASC
  const { data: items } = await supabase
    .from('social_media_plan_items_algoritmo_milionario')
    .select('*')
    .eq('plan_id', id)
    .order('day_number', { ascending: true })
    .order('slot_number', { ascending: true })

  return Response.json({ plan, items: items ?? [] })
}

export async function PATCH(
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
  const { data: plan } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!plan || plan.user_id !== user.id) return new Response('Not found', { status: 404 })

  let body: { status?: string; startDate?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status !== undefined) {
    if (!['draft', 'generating', 'active', 'completed', 'error'].includes(body.status)) {
      return new Response('status must be one of: draft, generating, active, completed, error', { status: 400 })
    }
    updates.status = body.status
  }

  if (body.startDate !== undefined) {
    updates.start_date = body.startDate
  }

  const { data: updated, error } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .update(updates)
    .eq('id', id)
    .select('id, title, product_name, duration_days, start_date, status, updated_at')
    .single()

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ plan: updated })
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
  const { data: plan } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!plan || plan.user_id !== user.id) return new Response('Not found', { status: 404 })

  await supabase.from('social_media_plans_algoritmo_milionario').delete().eq('id', id)

  return new Response(null, { status: 204 })
}
