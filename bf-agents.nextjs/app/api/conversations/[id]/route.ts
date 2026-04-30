// app/api/conversations/[id]/route.ts — GET messages, DELETE conversation
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
  const { data: conv } = await supabase
    .from('conversations_algoritmo_milionario')
    .select('id, user_id, title, model_slug, agent_id')
    .eq('id', id)
    .single()
  if (!conv || conv.user_id !== user.id) return new Response('Not found', { status: 404 })

  const { data: messages } = await supabase
    .from('messages_algoritmo_milionario')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return Response.json({
    conversation: { id: conv.id, title: conv.title, model_slug: conv.model_slug, agent_id: conv.agent_id },
    messages: messages ?? [],
  })
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

  const { data: conv } = await supabase
    .from('conversations_algoritmo_milionario')
    .select('user_id')
    .eq('id', id)
    .single()
  if (!conv || conv.user_id !== user.id) return new Response('Not found', { status: 404 })

  await supabase.from('conversations_algoritmo_milionario').delete().eq('id', id)
  return new Response(null, { status: 204 })
}
