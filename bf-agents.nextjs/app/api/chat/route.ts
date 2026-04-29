// app/api/chat/route.ts — Streaming via OpenRouter
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { openrouter, resolveModel } from '@/lib/openrouter'

const ChatSchema = z.object({
  message:        z.string().min(1).max(4000).trim(),
  conversationId: z.string().uuid().optional(),
  model:          z.string().min(1),
  agentId:        z.string().uuid().optional().nullable(),
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

  const { message, conversationId, model, agentId } = parsed.data

  // 3. Verifica limite de uso
  const { data: withinLimit } = await supabase.rpc('check_usage_limit_am', {
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

  // 8. Chama OpenRouter com stream
  let stream: AsyncIterable<{ choices: { delta: { content?: string } }[]; usage?: { total_tokens?: number } }>
  try {
    stream = await openrouter.chat.completions.create({
      model: resolvedModel,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: message },
      ],
    }) as never
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao conectar com a IA'
    return new Response(msg, { status: 502 })
  }

  // 9. Retorna ReadableStream + salva mensagens após terminar
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let totalTokens = 0

      // Envia o conversationId como primeiro chunk para o cliente referenciar
      controller.enqueue(new TextEncoder().encode(`__CONV_ID__${convId}__\n`))

      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          fullResponse += text
          if (chunk.usage?.total_tokens) totalTokens = chunk.usage.total_tokens
          if (text) controller.enqueue(new TextEncoder().encode(text))
        }
      } catch { /* stream ended */ }

      // Salva mensagens e incrementa uso em paralelo
      if (convId) {
        await Promise.allSettled([
          supabase.from('messages_algoritmo_milionario').insert([
            { conversation_id: convId, user_id: user.id, role: 'user', content: message, model_slug: model },
            { conversation_id: convId, user_id: user.id, role: 'assistant', content: fullResponse, tokens_used: totalTokens, model_slug: resolvedModel },
          ]),
          supabase.from('conversations_algoritmo_milionario').update({ updated_at: new Date().toISOString() }).eq('id', convId),
          supabase.rpc('increment_usage_am', { p_user_id: user.id, p_feature: 'chat_messages' }),
        ])
      }

      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Conversation-Id': convId ?? '',
    },
  })
}
