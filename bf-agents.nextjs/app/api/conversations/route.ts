// app/api/conversations/route.ts — GET: list user's conversations
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('conversations_algoritmo_milionario')
    .select('id, title, model_slug, agent_id, updated_at, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100)

  if (error) return new Response(error.message, { status: 500 })

  return Response.json({ conversations: data ?? [] })
}
