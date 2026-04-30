// lib/ai-generators.ts — Server-only. Non-streaming AI generation via OpenRouter.
// All functions call openai/gpt-4o with json_object response_format and return
// parsed JavaScript objects ready to be stored in the database.

import { openrouter } from '@/lib/openrouter'

// ─── Shared model slug ───────────────────────────────────────────────────────

const GPT4O = 'google/gemini-2.5-flash'

// ─── Helper ──────────────────────────────────────────────────────────────────

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
): Promise<unknown> {
  const completion = await openrouter.chat.completions.create({
    model: GPT4O,
    response_format: { type: 'json_object' },
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    throw new Error('OpenRouter returned an empty response content.')
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(
      `Failed to parse JSON from OpenRouter response. Raw content (first 500 chars): ${raw.slice(0, 500)}`,
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. generateSocialMediaPlan
// ─────────────────────────────────────────────────────────────────────────────

export interface SocialMediaPlanInput {
  productName: string
  offerInfo: string
  targetAudience: string
  differentials: string
  durationDays: 15 | 30
}

export interface StorySlot {
  slot: number
  title: string
  content: string
  caption: string
}

export interface PostItem {
  type: 'reel' | 'feed' | 'carousel'
  title: string
  content: string
  caption: string
}

export interface DayPlan {
  day_number: number
  stories: StorySlot[]
  posts: PostItem[]
}

export interface SocialMediaPlanOutput {
  days: DayPlan[]
}

const SOCIAL_MEDIA_SYSTEM_PROMPT = `
Você é uma IA especialista em estratégia de conteúdo para redes sociais, combinando as mentalidades de Gary Vaynerchuk e Érico Rocha aplicadas ao mercado brasileiro de marketing digital.

PERSPECTIVA GARY VEE:
- "Document, don't create" — conteúdo autêntico vence conteúdo produzido
- Volume e consistência são inegociáveis — publique todo dia, sem exceção
- Stories são o canal mais íntimo: use para bastidores, micro-revelações, prova social diária
- Cada conteúdo é um "jab" (valor) ou um "right hook" (pedido de ação) — nunca inverta a proporção
- Posts de feed/reels/carrossel têm maior alcance orgânico: use para aquisição
- Seja nativo à plataforma: Instagram quer emoção, prova e velocidade

PERSPECTIVA ERICO ROCHA (sequenciamento de lançamento):
- Aquecimento de audiência antes de qualquer oferta é mandatório
- Semana 1: construção de autoridade e identificação de problema (consciência da dor)
- Semana 2: educação sobre o novo caminho possível (esperança e transformação)
- Semana 3: mecanismo único e prova (por que funciona, casos reais)
- Semana 4+: oferta e urgência real (carrinho aberto, bônus, fechamento)
- CPLs (Conteúdos de Pré-Lançamento) via Stories devem criar antecipação progressiva

REGRAS DE DISTRIBUIÇÃO DE POSTS:
- Posts (reel, feed, carousel) aparecem APENAS 3 vezes por semana:
  - Dia 1 de cada semana (segunda): reel
  - Dia 3 de cada semana (quarta): feed
  - Dia 5 de cada semana (sexta): carousel
- Todos os dias recebem exatamente 3 stories (slots 1, 2 e 3)
- Dias sem posts recebem "posts": []

OUTPUT: Responda EXCLUSIVAMENTE com JSON válido seguindo exatamente este schema:
{
  "days": [
    {
      "day_number": 1,
      "stories": [
        { "slot": 1, "title": "...", "content": "...", "caption": "..." },
        { "slot": 2, "title": "...", "content": "...", "caption": "..." },
        { "slot": 3, "title": "...", "content": "...", "caption": "..." }
      ],
      "posts": [
        { "type": "reel", "title": "...", "content": "...", "caption": "..." }
      ]
    }
  ]
}

IDIOMA: Português brasileiro. Tom: direto, marketing focado em conversão, linguagem do empreendedor digital brasileiro.
`

export async function generateSocialMediaPlan(
  input: SocialMediaPlanInput,
): Promise<SocialMediaPlanOutput> {
  const userPrompt = `
Crie um plano completo de conteúdo para redes sociais com ${input.durationDays} dias.

PRODUTO: ${input.productName}
OFERTA: ${input.offerInfo}
PÚBLICO-ALVO: ${input.targetAudience}
DIFERENCIAIS: ${input.differentials}
DURAÇÃO: ${input.durationDays} dias

Gere TODOS os ${input.durationDays} dias. Não omita nenhum dia. Cada dia deve ter exatamente 3 stories.
Posts (reel/feed/carrossel) aparecem apenas nos dias 1, 3 e 5 de cada semana (e seus equivalentes nas semanas seguintes).
  `.trim()

  const result = await callOpenRouter(
    SOCIAL_MEDIA_SYSTEM_PROMPT.trim(),
    userPrompt,
    8000,
  )

  return result as SocialMediaPlanOutput
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. generateProduct
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateProductInput {
  rawDescription: string
  market: string
  price: number
  icp: string
  differentials: string
}

export interface VslSection {
  section: string
  objective: string
  key_points: string[]
}

export interface ProductBump {
  name: string
  description: string
  price_suggestion: string
  why: string
}

export interface ProductUpsell {
  name: string
  description: string
  price_suggestion: string
  positioning: string
}

export interface ProductDownsell {
  name: string
  description: string
  price_suggestion: string
  positioning: string
}

export interface UniqueMechanism {
  problem_mechanism: string
  solution_mechanism: string
}

export interface GenerateProductOutput {
  product_name: string
  headlines: string[]
  description: string
  unique_mechanism: UniqueMechanism
  social_proof_suggestions: string[]
  vsl_structure: VslSection[]
  tsl_structure: VslSection[]
  order_bump: ProductBump
  upsell: ProductUpsell
  downsell: ProductDownsell
}

const GENERATE_PRODUCT_SYSTEM_PROMPT = `
Você é uma IA que combina as metodologias de Alex Hormozi e Stefan Georgi aplicadas ao mercado brasileiro de infoprodutos.

PERSPECTIVA ALEX HORMOZI ($100M Offers):
- Toda oferta deve ser analisada pela Equação de Valor: Valor = (Dream Outcome × Perceived Likelihood) ÷ (Time Delay × Effort & Sacrifice)
- Para aumentar valor percebido: maximize resultado dos sonhos, maximize probabilidade percebida de alcançar, minimize tempo de resultado, minimize esforço exigido
- Order bumps devem remover objeções específicas do produto principal — não ser bônus genéricos
- Upsells devem acelerar o resultado prometido pelo produto principal
- Downsells devem preservar a venda ao remover a barreira de entrada (preço ou compromisso)
- Garantias são inversão de risco — o risco deve ficar 100% no seu lado, não no do cliente

PERSPECTIVA STEFAN GEORGI (RMBC Method):
- Mecanismo Único: o "porquê funciona" que ninguém mais tem — específico, técnico, crível
- Headlines precisam carregar o mecanismo ou a transformação de forma específica e verificável
- Problem Mechanism: como o problema opera mecanicamente no mundo do avatar
- Solution Mechanism: como o produto interrompe ou reverte esse mecanismo especificamente
- VSL e TSL (Text Sales Letter) têm estrutura diferente mas mesma lógica: hook → problema → mecanismo → solução → oferta → garantia → CTA

ESTRUTURA VSL RMBC:
1. Hook — primeiros 15 segundos, pergunta ou declaração chocante específica para o avatar
2. História/Problema — agita o estado atual com emoção e especificidade, sem solução ainda
3. Mecanismo Único — apresenta o "novo caminho" com lógica técnica acessível
4. A Solução — conecta o mecanismo ao produto com benefícios ancorados no mecanismo
5. Oferta + Stack de Valor — empilha valor real com price anchoring (Hormozi value stacking)
6. Garantia — inverte o risco completamente para o vendedor
7. Fechamento + CTA — volta à dor inicial, contraste com futuro desejado, urgência real

OUTPUT: Responda EXCLUSIVAMENTE com JSON válido seguindo exatamente este schema:
{
  "product_name": "string",
  "headlines": ["string", "string", "string", "string"],
  "description": "string",
  "unique_mechanism": {
    "problem_mechanism": "string",
    "solution_mechanism": "string"
  },
  "social_proof_suggestions": ["string", "string", "string"],
  "vsl_structure": [
    { "section": "Hook", "objective": "string", "key_points": ["string"] },
    { "section": "História/Problema", "objective": "string", "key_points": ["string"] },
    { "section": "Mecanismo Único", "objective": "string", "key_points": ["string"] },
    { "section": "A Solução", "objective": "string", "key_points": ["string"] },
    { "section": "Oferta + Stack de Valor", "objective": "string", "key_points": ["string"] },
    { "section": "Garantia", "objective": "string", "key_points": ["string"] },
    { "section": "Fechamento + CTA", "objective": "string", "key_points": ["string"] }
  ],
  "tsl_structure": [
    { "section": "Hook", "objective": "string", "key_points": ["string"] },
    { "section": "História/Problema", "objective": "string", "key_points": ["string"] },
    { "section": "Mecanismo Único", "objective": "string", "key_points": ["string"] },
    { "section": "A Solução", "objective": "string", "key_points": ["string"] },
    { "section": "Oferta + Stack de Valor", "objective": "string", "key_points": ["string"] },
    { "section": "Garantia", "objective": "string", "key_points": ["string"] },
    { "section": "Fechamento + CTA", "objective": "string", "key_points": ["string"] }
  ],
  "order_bump": { "name": "string", "description": "string", "price_suggestion": "string", "why": "string" },
  "upsell": { "name": "string", "description": "string", "price_suggestion": "string", "positioning": "string" },
  "downsell": { "name": "string", "description": "string", "price_suggestion": "string", "positioning": "string" }
}

IDIOMA: Português brasileiro. Tom: direto ao ponto, baseado em dados e mecanismos, copywriting de resposta direta.
`

export async function generateProduct(
  input: GenerateProductInput,
): Promise<GenerateProductOutput> {
  const userPrompt = `
Crie a estrutura completa de produto e oferta com base nas informações abaixo.

DESCRIÇÃO BRUTA DO PRODUTO: ${input.rawDescription}
MERCADO: ${input.market}
PREÇO: R$${input.price}
ICP (Perfil de Cliente Ideal): ${input.icp}
DIFERENCIAIS: ${input.differentials}

Aplique a Equação de Valor de Hormozi e o método RMBC de Stefan Georgi para criar:
- Um nome de produto com posicionamento claro
- 4 headlines de alta conversão com mecanismo específico
- Mecanismo único (problem mechanism + solution mechanism)
- Estrutura completa de VSL e TSL com 7 seções cada
- Order bump, upsell e downsell estratégicos para o funil
  `.trim()

  const result = await callOpenRouter(
    GENERATE_PRODUCT_SYSTEM_PROMPT.trim(),
    userPrompt,
    4000,
  )

  return result as GenerateProductOutput
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. generateOfferAnalysis
// ─────────────────────────────────────────────────────────────────────────────

export interface GenerateOfferAnalysisInput {
  sourceText: string
  sourceUrl?: string
}

export interface ScoreDimension {
  score: number
  max: number
  comment: string
}

export interface OfferScores {
  hook_strength: ScoreDimension
  clarity_of_problem: ScoreDimension
  unique_mechanism: ScoreDimension
  offer_stack_value: ScoreDimension
  social_proof: ScoreDimension
  guarantee_strength: ScoreDimension
  cta_effectiveness: ScoreDimension
  urgency_scarcity: ScoreDimension
}

export interface OfferXray {
  hook_type: string
  identified_mechanism: string
  offer_elements: string[]
  missing_elements: string[]
  copywriting_frameworks_detected: string[]
}

export interface ModelingSuggestion {
  dimension: string
  current: string
  suggestion: string
  priority: 'alta' | 'média' | 'baixa'
}

export interface GenerateOfferAnalysisOutput {
  summary: string
  scores: OfferScores
  xray: OfferXray
  modeling_suggestions: ModelingSuggestion[]
}

const OFFER_ANALYSIS_SYSTEM_PROMPT = `
Você é uma IA que combina a perspectiva analítica de Stefan Georgi (método RMBC, análise de copy) e Alex Hormozi (auditoria de oferta pelo modelo $100M Offers) para avaliar páginas de vendas e copies de forma honesta e cirúrgica.

PERSPECTIVA STEFAN GEORGI (análise de copy RMBC):
- Hook: os primeiros 15 segundos/linhas são suficientemente chocantes ou intrigantes para forçar atenção?
- Mecanismo Único: a copy apresenta um "porquê funciona" específico e diferenciado, ou é genérica?
- Problema: a dor é agitada com especificidade e linguagem do avatar, ou é superficial?
- Você analisa copy como um copywriter sênior revisando o trabalho de um estudante — honesto, construtivo, cirúrgico

PERSPECTIVA ALEX HORMOZI (auditoria de oferta):
- Equação de Valor: a oferta maximiza Dream Outcome × Perceived Likelihood e minimiza Time Delay × Effort?
- Stack de Valor: os elementos da oferta empilham valor real ou são bônus genéricos?
- Garantia: a garantia inverte o risco para o vendedor ou é uma garantia fraca que não move ponteiro?
- CTA: o call-to-action é claro, urgente e com razão real para agir agora?
- Urgência/Escassez: é urgência real (justificada) ou artificial (timer falso)?

CALIBRAÇÃO DE SCORES:
- Seja honesto — não infle scores para parecer positivo
- 9-10: excepcional, raro, modelo de referência para o mercado
- 7-8: sólido, acima da média, tem pontos fortes claros
- 5-6: mediano, funciona mas perde conversões por falta de precisão
- 3-4: fraco, problemas estruturais que prejudicam conversão significativamente
- 1-2: muito fraco, precisa de reescrita substancial
- Aponte problemas específicos com exemplos do texto analisado

OUTPUT: Responda EXCLUSIVAMENTE com JSON válido seguindo exatamente este schema:
{
  "summary": "string — análise geral em 2-3 parágrafos, identificando o diagnóstico principal",
  "scores": {
    "hook_strength": { "score": 0, "max": 10, "comment": "string" },
    "clarity_of_problem": { "score": 0, "max": 10, "comment": "string" },
    "unique_mechanism": { "score": 0, "max": 10, "comment": "string" },
    "offer_stack_value": { "score": 0, "max": 10, "comment": "string" },
    "social_proof": { "score": 0, "max": 10, "comment": "string" },
    "guarantee_strength": { "score": 0, "max": 10, "comment": "string" },
    "cta_effectiveness": { "score": 0, "max": 10, "comment": "string" },
    "urgency_scarcity": { "score": 0, "max": 10, "comment": "string" }
  },
  "xray": {
    "hook_type": "string — classificação do tipo de hook (pergunta direta, dado chocante, história, promessa, etc.)",
    "identified_mechanism": "string — o mecanismo único identificado, ou 'Não identificado' se ausente",
    "offer_elements": ["string"],
    "missing_elements": ["string"],
    "copywriting_frameworks_detected": ["string"]
  },
  "modeling_suggestions": [
    {
      "dimension": "string — qual dimensão da copy/oferta",
      "current": "string — o que existe hoje (cite trecho real se possível)",
      "suggestion": "string — sugestão concreta e acionável de melhoria",
      "priority": "alta"
    }
  ]
}

IDIOMA: Português brasileiro. Tom: analítico, direto, sem elogios vazios — como um copywriter sênior que respeita o trabalho mas cobra resultados.
`

export async function generateOfferAnalysis(
  input: GenerateOfferAnalysisInput,
): Promise<GenerateOfferAnalysisOutput> {
  const sourceInfo = input.sourceUrl
    ? `URL DE REFERÊNCIA: ${input.sourceUrl}\n\n`
    : ''

  const userPrompt = `
${sourceInfo}Analise o seguinte texto de copy/página de vendas com rigor técnico e honestidade. Identifique pontos fortes, fraquezas estruturais e oportunidades concretas de melhoria.

TEXTO PARA ANÁLISE:
---
${input.sourceText}
---

Aplique a análise RMBC de Stefan Georgi e a auditoria de oferta do modelo $100M Offers de Alex Hormozi. Seja específico — cite trechos reais quando apontar problemas ou pontos fortes. Não infle scores.
  `.trim()

  const result = await callOpenRouter(
    OFFER_ANALYSIS_SYSTEM_PROMPT.trim(),
    userPrompt,
    4000,
  )

  return result as GenerateOfferAnalysisOutput
}
