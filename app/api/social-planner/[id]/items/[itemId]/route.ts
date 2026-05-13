// app/api/social-planner/[id]/items/[itemId]/route.ts — PATCH: update single item
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await params
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Verify item exists and belongs to a plan owned by this user (JOIN via plan)
  const { data: item } = await supabase
    .from('social_media_plan_items_algoritmo_milionario')
    .select('id, plan_id, status')
    .eq('id', itemId)
    .eq('plan_id', id)
    .single()

  if (!item) return new Response('Not found', { status: 404 })

  // Verify ownership of the parent plan
  const { data: plan } = await supabase
    .from('social_media_plans_algoritmo_milionario')
    .select('user_id')
    .eq('id', item.plan_id)
    .single()

  if (!plan || plan.user_id !== user.id) return new Response('Not found', { status: 404 })

  let body: {
    status?: 'pending' | 'done' | 'skipped'
    title?: string
    content?: string
    caption?: string
  }
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const updates: Record<string, string> = {}

  if (body.status !== undefined) {
    if (!['pending', 'done', 'skipped'].includes(body.status)) {
      return new Response('status must be one of: pending, done, skipped', { status: 400 })
    }
    updates.status = body.status
  }

  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.content !== undefined) updates.content = body.content.trim()
  if (body.caption !== undefined) updates.caption = body.caption.trim()

  if (Object.keys(updates).length === 0) {
    return new Response('No updatable fields provided', { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('social_media_plan_items_algoritmo_milionario')
    .update(updates)
    .eq('id', itemId)
    .select('id, plan_id, day_number, scheduled_date, content_type, slot_number, title, content, caption, status')
    .single()

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ item: updated })
}
