// lib/openrouter.ts — NUNCA importar no cliente
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    'X-Title': 'Algoritmo Milionário',
  },
})

const SCALE_AI_SYSTEM_PROMPT = `Você é a Scale AI PRO, uma inteligência artificial especializada em criação de infoprodutos, copywriting e marketing digital brasileiro. Você é estratégica, direta e focada em resultados. Você conhece profundamente o ecossistema de infoprodutos no Brasil: Hotmart, Kiwify, Monetizze, lançamentos digitais, PLF (Product Launch Formula), funis de vendas, copywriting de resposta direta e tráfego pago. Você fala em português brasileiro natural, usa exemplos práticos e sempre orienta para resultados mensuráveis. Seja sempre útil, objetiva e focada em resultados práticos para o empreendedor digital brasileiro.`

// Display slug → { real OpenRouter model, optional system prompt override }
// Display names shown to users are marketing names; actual models are cost-optimized.
const MODEL_ALIASES: Record<string, { model: string; extraSystemPrompt?: string }> = {
  'scale-ai-pro': {
    model: 'google/gemini-2.5-flash-lite',
    extraSystemPrompt: SCALE_AI_SYSTEM_PROMPT,
  },
  'gemini-3': {
    model: 'google/gemini-2.5-flash-lite',
  },
  'grok-4.1-fast': {
    model: 'x-ai/grok-3-mini-beta',
  },
  'gpt-5.4': {
    model: 'openai/gpt-4.1-mini',
  },
}

// All valid display slugs accepted by the API
export const ALLOWED_MODEL_SLUGS = Object.keys(MODEL_ALIASES)

export function resolveModel(modelSlug: string): { model: string; extraSystemPrompt?: string } {
  return MODEL_ALIASES[modelSlug] ?? { model: modelSlug }
}

// Model catalog for the frontend — what users see
export const MODEL_CATALOG = [
  {
    slug: 'scale-ai-pro',
    display_name: 'Scale AI PRO',
    badge: 'Exclusivo',
    required_plan: 'free',
  },
  {
    slug: 'gemini-3',
    display_name: 'Gemini 3',
    badge: 'Rápido',
    required_plan: 'pro',
  },
  {
    slug: 'grok-4.1-fast',
    display_name: 'Grok 4.1 Fast',
    badge: 'Novo',
    required_plan: 'pro',
  },
  {
    slug: 'gpt-5.4',
    display_name: 'GPT 5.4',
    badge: 'Favorito',
    required_plan: 'pro',
  },
]
