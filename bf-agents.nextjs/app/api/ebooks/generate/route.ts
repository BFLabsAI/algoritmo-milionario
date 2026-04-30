import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { createEbookGeneration } from '@/lib/gamma'
import { getPresignedUrl } from '@/lib/b2'

const EbookGenerateSchema = z.object({
  title:           z.string().min(1).max(200).trim(),
  description:     z.string().min(1).max(2000).trim(),
  theme:           z.string().min(1).max(200).trim(),
  page_count:      z.number().int().min(1).max(50),
  tone:            z.string().min(1).max(100).trim(),
  target_audience: z.string().min(1).max(200).trim(),
  language:        z.string().min(1).max(50).trim(),
  style_image_id:  z.string().uuid().optional(),
})

const GAMMA_PROMPT_OPTIMIZER_SYSTEM = `You are an expert content strategist for digital infoproducts.

Your job is to transform a basic ebook brief into a highly detailed, structured content outline optimized for Gamma's AI document generator.

IMPORTANT LANGUAGE RULE:
Detect the intended language from the brief and write your entire output in that language.
If the brief specifies "Português do Brasil", write in Brazilian Portuguese.
If "English", write in English. If "Español", write in Spanish.

GAMMA OPTIMIZATION RULES:
Gamma generates visual documents card by card (like presentation slides in document format).
Your output must guide Gamma to create a cohesive, high-value ebook. Include:

1. A compelling document title line
2. A one-paragraph reader promise (what transformation they will achieve)
3. A detailed chapter-by-chapter outline. For each chapter:
   - A punchy, benefit-driven chapter title
   - 3-5 bullet points of specific topics, frameworks, or examples to cover
   - One visual recommendation (chart, diagram, checklist, quote, table, or illustration suggestion)
4. A conclusion section with key takeaways and a strong call-to-action
5. Tone and style notes that Gamma should follow throughout (match the requested tone exactly)

If a visual style reference is included, describe how it should influence color palette, mood, and layout.

OUTPUT FORMAT:
Return only the enhanced content outline — the final inputText to send directly to Gamma.
Do not explain your changes. Do not add meta-commentary.
Do not wrap in markdown code blocks.
Write the output as a clean, structured document that Gamma will use as its source of truth.`

async function enhanceEbookInputText(inputText: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        { role: 'system', content: GAMMA_PROMPT_OPTIMIZER_SYSTEM },
        { role: 'user',   content: inputText },
      ],
      max_tokens: 2048,
      temperature: 0.6,
    }),
  })

  if (!res.ok) throw new Error(`Enhancer ${res.status}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content?.trim() ?? inputText
}

async function extractImageStyle(imageUrl: string): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            {
              type: 'text',
              text: 'Analyze the visual style of this image for document design purposes. In 3-4 sentences describe: the color palette (specific colors), mood and atmosphere, design aesthetic, and visual feel. Be precise and specific so this can guide the visual design of a PDF document.',
            },
          ],
        },
      ],
      max_tokens: 256,
    }),
  })

  if (!res.ok) throw new Error(`Vision model ${res.status}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content?.trim() ?? ''
}

function buildInputText(
  data: z.infer<typeof EbookGenerateSchema>,
  styleDescription?: string,
): string {
  const styleBlock = styleDescription
    ? `\n\n## Estilo Visual de Referência\n${styleDescription}\nUse este estilo visual como inspiração para o design e apresentação visual do ebook.`
    : ''

  return `# ${data.title}

## Descrição
${data.description}

## Especificações
- Tema: ${data.theme}
- Páginas: ${data.page_count}
- Tom de voz: ${data.tone}
- Público-alvo: ${data.target_audience}
- Idioma: ${data.language}${styleBlock}

## Estrutura esperada
1. Capa com título impactante
2. Sumário
3. Introdução envolvente que apresenta o problema e a solução
4. Capítulos com conteúdo aprofundado, exemplos práticos e dicas acionáveis
5. Conclusão com chamada para ação clara
Use o tom "${data.tone}" ao longo de todo o conteúdo e escreva em ${data.language}.`
}

export async function POST(req: Request) {
  const supabase = createAdminClient()

  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '') ?? ''
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return new Response('Unauthorized', { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return new Response('Invalid JSON', { status: 400 }) }
  const parsed = EbookGenerateSchema.safeParse(body)
  if (!parsed.success) return new Response('Payload inválido', { status: 400 })

  const { title, description, theme, page_count, tone, target_audience, language, style_image_id } = parsed.data

  const { data: withinLimit } = await supabase.rpc('check_usage_limit_am', {
    p_user_id: user.id,
    p_feature: 'ebooks_generated',
  })
  if (withinLimit === false)
    return new Response('Limite mensal atingido. Faça upgrade para continuar.', { status: 429 })

  const { data: record, error: insertError } = await supabase
    .from('generated_ebooks_algoritmo_milionario')
    .insert({
      user_id:         user.id,
      title,
      description,
      theme,
      page_count,
      tone,
      target_audience,
      language,
      status:          'generating',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[ebooks] insert error:', JSON.stringify(insertError))
    return new Response('Erro ao criar registro', { status: 500 })
  }

  // Optional: extract visual style from a reference image
  let styleDescription: string | undefined
  if (style_image_id) {
    try {
      const { data: img } = await supabase
        .from('generated_images_algoritmo_milionario')
        .select('storage_path')
        .eq('id', style_image_id)
        .eq('user_id', user.id)
        .single()

      if (img?.storage_path) {
        const imageUrl = img.storage_path.startsWith('http')
          ? img.storage_path
          : await getPresignedUrl(img.storage_path)
        styleDescription = await extractImageStyle(imageUrl)
      }
    } catch {
      // non-fatal — continue without style
    }
  }

  let gammaId: string
  try {
    const rawInputText = buildInputText(parsed.data, styleDescription)

    let inputText = rawInputText
    try {
      inputText = await enhanceEbookInputText(rawInputText)
    } catch {
      // non-fatal — fall back to raw
    }

    const result = await createEbookGeneration({ inputText, numCards: page_count })
    gammaId = result.id
  } catch (err: unknown) {
    await supabase
      .from('generated_ebooks_algoritmo_milionario')
      .update({ status: 'error' })
      .eq('id', record.id)
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar geração'
    return new Response(msg, { status: 502 })
  }

  await supabase
    .from('generated_ebooks_algoritmo_milionario')
    .update({ storage_path: `gamma:${gammaId}` })
    .eq('id', record.id)

  await supabase.rpc('increment_usage_am', { p_user_id: user.id, p_feature: 'ebooks_generated' })

  return Response.json({ id: record.id })
}
