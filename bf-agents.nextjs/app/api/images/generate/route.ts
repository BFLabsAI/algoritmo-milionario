import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { openrouter } from '@/lib/openrouter'
import { uploadImageBuffer, getPresignedUrl } from '@/lib/b2'
import { IMAGE_ALLOWED_SLUGS } from '@/lib/image-models'

const PROMPT_OPTIMIZER_SYSTEM = `You are an expert image-generation prompt optimizer.

Your job is to transform any user request into a highly detailed, clear, production-ready image prompt that improves visual quality, composition, realism, style consistency, lighting, texture, and overall execution.

Always understand the user's intent first, even if the request is short, messy, incomplete, or written in any language.

IMPORTANT LANGUAGE RULE:
Internally translate the user's request into English to improve image-generation quality, because English prompts usually produce better results.

However, any visible text, letters, words, captions, UI labels, signs, logos, icons with text, typography, or written elements that must appear inside the image MUST remain in the original language used by the user, unless the user explicitly defines another language.

Examples:
- If the user asks in Portuguese for an image with the text "Gerando sua imagem...", the final image prompt must be written in English, but the visible text inside the image must remain exactly: "Gerando sua imagem..."
- If the user asks in Spanish for a poster with "Oferta especial", the prompt should be in English, but the poster text must remain "Oferta especial".
- If the user defines a specific language, use that defined language for all visible text inside the image.

PROMPT OPTIMIZATION RULES:
Convert the user's idea into a polished image prompt using:
- Clear subject description
- Composition and layout
- Camera angle or perspective when relevant
- Lighting direction and atmosphere
- Color palette
- Materials and textures
- Visual hierarchy
- Design style
- Background details
- Mood and emotion
- Quality modifiers such as high detail, premium finish, realistic shadows, clean edges, balanced spacing, professional design
- Aspect ratio if provided by the user
- Negative instructions when needed, such as avoiding blurry text, distorted letters, extra fingers, messy layout, bad anatomy, low resolution, watermark, random symbols, incorrect spelling, or unwanted objects

TEXT ACCURACY RULE:
When the image includes visible text, preserve spelling exactly as provided by the user. Do not translate, rewrite, simplify, or invent text unless the user asks for that.
Use clear typography instructions such as:
"accurate readable text"
"clean modern typography"
"no misspellings"
"preserve the exact wording"
"text must be sharp and legible"

ICON AND LETTER RULE:
If the user requests icons, letters, symbols, UI elements, or branded visual language, describe them clearly and keep them aligned with the original or defined language/cultural context.
Do not replace local language text with English inside the image.

OUTPUT FORMAT:
Return only the final optimized prompt.
Do not explain what you changed.
Do not add commentary.
Do not mention translation unless necessary.
Do not include markdown unless the user asks.`

const ImageGenerateSchema = z.object({
  prompt: z.string().min(1).max(1000).trim(),
  model:  z.enum(IMAGE_ALLOWED_SLUGS as [string, ...string[]]),
})

async function enhancePrompt(userPrompt: string): Promise<string> {
  const completion = await openrouter.chat.completions.create({
    model: 'google/gemini-2.5-flash-lite',
    messages: [
      { role: 'system', content: PROMPT_OPTIMIZER_SYSTEM },
      { role: 'user',   content: userPrompt },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  })
  return completion.choices[0]?.message?.content?.trim() ?? userPrompt
}

async function generateImageViaOpenRouter(model: string, prompt: string): Promise<Buffer> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'Algoritmo Milionário',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText)
    throw new Error(`OpenRouter ${res.status}: ${errText}`)
  }

  const data = await res.json() as {
    choices: Array<{
      message: {
        images?: Array<{ type: string; image_url: { url: string } }>
        content?: string | null
      }
    }>
  }

  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url
  if (!imageUrl) throw new Error('Nenhuma imagem na resposta do modelo')

  if (imageUrl.startsWith('data:')) {
    const base64 = imageUrl.split(',')[1]
    return Buffer.from(base64, 'base64')
  }

  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Erro ao baixar imagem: ${imgRes.status}`)
  return Buffer.from(await imgRes.arrayBuffer())
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const parsed = ImageGenerateSchema.safeParse(body)
  if (!parsed.success) return new Response('Payload inválido', { status: 400 })

  const { prompt, model } = parsed.data

  const { data: withinLimit } = await supabase.rpc('check_usage_limit_am', {
    p_user_id: user.id,
    p_feature: 'images_generated',
  })
  if (withinLimit === false)
    return new Response('Limite mensal atingido. Faça upgrade para continuar.', { status: 429 })

  // Step 1: enhance the prompt with gemini-2.5-flash-lite
  let enhancedPrompt: string
  try {
    enhancedPrompt = await enhancePrompt(prompt)
  } catch {
    enhancedPrompt = prompt
  }

  // Step 2: generate the image with the chosen model
  let imageBuffer: Buffer
  try {
    imageBuffer = await generateImageViaOpenRouter(model, enhancedPrompt)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar imagem'
    return new Response(msg, { status: 502 })
  }

  let storagePath: string
  let imageUrl: string
  try {
    storagePath = await uploadImageBuffer(imageBuffer, user.id, 'image/png')
    imageUrl = await getPresignedUrl(storagePath)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar imagem no storage'
    return new Response(msg, { status: 500 })
  }

  const { data: record, error: insertError } = await supabase
    .from('generated_images_algoritmo_milionario')
    .insert({ user_id: user.id, prompt, model_used: model, storage_path: storagePath })
    .select('id')
    .single()

  if (insertError) {
    console.error('[image-gen] insert error:', JSON.stringify(insertError))
    return new Response(`Erro ao salvar registro: ${insertError.message} (${insertError.code})`, { status: 500 })
  }

  await supabase.rpc('increment_usage_am', { p_user_id: user.id, p_feature: 'images_generated' })

  return Response.json({ id: record.id, image_url: imageUrl })
}
