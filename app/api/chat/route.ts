// app/api/chat/route.ts — Streaming via AI SDK v6 + OpenRouter
import { z } from 'zod'
import { streamText } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createAdminClient } from '@/lib/supabase/server'
import { resolveModel, ALLOWED_MODEL_SLUGS } from '@/lib/openrouter'

const openrouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'Algoritmo Milionário',
  },
})

const ChatSchema = z.object({
  message:        z.string().max(4000).trim().optional().default(''),
  conversationId: z.string().uuid().optional(),
  model:          z.enum(ALLOWED_MODEL_SLUGS as [string, ...string[]]),
  agentId:        z.string().uuid().optional().nullable(),
  imageBase64:    z.string().max(10_000_000).optional(),
  imageMimeType:  z.string().optional(),
})

export async function POST(req: Request) {
  const supabase = createAdminClient()

  // 1. Valida sessão
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. Valida payload
  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) return new Response('Invalid payload', { status: 400 })

  const { message, conversationId, model, agentId, imageBase64, imageMimeType } = parsed.data
  if (!message && !imageBase64) return new Response('Mensagem ou imagem obrigatória', { status: 400 })

  // 3. Verifica limite de uso
  const { data: withinLimit } = await supabase.rpc('check_usage_limit', {
    p_user_id: user.id,
    p_feature: 'chat_messages',
  })
  if (withinLimit === false) return new Response('Limite mensal atingido. Faça upgrade para continuar.', { status: 429 })

  // 4. Resolve o modelo e system prompt
  const { model: resolvedModel, extraSystemPrompt } = resolveModel(model)
  let systemPrompt = extraSystemPrompt ?? 'Você é um assistente de IA útil, preciso e amigável. Responda em português brasileiro.'

  // 5. Busca system prompt do agente (se houver)
  if (agentId) {
    const { data: agent } = await supabase
      .from('agents_algoritmo_milionario')
      .select('system_prompt')
      .eq('id', agentId)
      .single()
    if (agent?.system_prompt) systemPrompt = agent.system_prompt
  }

  // 6. Busca ou cria conversa
  let convId = conversationId
  if (!convId) {
    const { data: newConv } = await supabase
      .from('conversations_algoritmo_milionario')
      .insert({ user_id: user.id, model_slug: model, agent_id: agentId ?? null, title: message.slice(0, 60) })
      .select('id')
      .single()
    convId = newConv?.id
  }

  // 7. Busca histórico (últimas 20 mensagens)
  let history: { role: string; content: string }[] = []
  if (convId) {
    const { data: msgs } = await supabase
      .from('messages_algoritmo_milionario')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)
    history = msgs ?? []
  }

  // 8. Chama OpenRouter com stream via AI SDK v6
  const userTextForDb = message || '[Imagem enviada]'
  const userContent = imageBase64
    ? [
        ...(message ? [{ type: 'text' as const, text: message }] : []),
        { type: 'image' as const, image: imageBase64, mimeType: (imageMimeType ?? 'image/jpeg') as `image/${string}` },
      ]
    : message

  const result = streamText({
    model: openrouterProvider(resolvedModel),
    system: systemPrompt,
    messages: [
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: userContent },
    ],
    abortSignal: req.signal,
    onFinish: async ({ text, usage }) => {
      if (convId) {
        await Promise.allSettled([
          supabase.from('messages_algoritmo_milionario').insert([
            { conversation_id: convId, user_id: user.id, role: 'user', content: userTextForDb, model_slug: model },
            { conversation_id: convId, user_id: user.id, role: 'assistant', content: text, tokens_used: usage?.totalTokens, model_slug: resolvedModel },
          ]),
          supabase.from('conversations_algoritmo_milionario').update({ updated_at: new Date().toISOString() }).eq('id', convId),
          supabase.rpc('increment_usage', { p_user_id: user.id, p_feature: 'chat_messages' }),
        ])
      }
    },
  })

  // 9. Retorna stream com conversation ID no header
  const response = result.toTextStreamResponse()
  response.headers.set('X-Conversation-Id', convId ?? '')
  return response
}
