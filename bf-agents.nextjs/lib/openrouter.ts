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

// Mapeamento do modelo próprio para o modelo base
export const MILLION_AI_CONFIG = {
  openrouter_model: 'openai/gpt-4o',
  system_prompt: `Você é a Million AI, uma inteligência artificial especializada em criação de infoprodutos, copywriting e marketing digital brasileiro. Você é estratégica, direta e focada em resultados. Você conhece profundamente o ecossistema de infoprodutos no Brasil: Hotmart, Kiwify, Monetizze, lançamentos digitais, PLF (Product Launch Formula), funis de vendas, copywriting de resposta direta e tráfego pago. Você fala em português brasileiro natural, usa exemplos práticos e sempre orienta para resultados mensuráveis. Seja sempre útil, objetiva e focada em resultados práticos para o empreendedor digital brasileiro.`,
}

export function resolveModel(modelSlug: string): { model: string; extraSystemPrompt?: string } {
  if (modelSlug === 'million-ai-1.0') {
    return {
      model: MILLION_AI_CONFIG.openrouter_model,
      extraSystemPrompt: MILLION_AI_CONFIG.system_prompt,
    }
  }
  return { model: modelSlug }
}
