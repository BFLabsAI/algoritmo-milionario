// lib/gamma.ts — Gamma API client. Nunca importar no cliente.
const BASE = 'https://public-api.gamma.app/v1.0'

function headers() {
  return {
    'X-API-KEY': process.env.GAMMA_API_KEY!,
    'Content-Type': 'application/json',
  }
}

export interface GammaCreateParams {
  inputText:       string
  numCards?:       number
  language?:       string
}

export interface GammaGenerationStatus {
  generationId: string
  status:       'pending' | 'completed' | 'failed'
  gammaUrl?:    string
  exportUrl?:   string
}

export async function createEbookGeneration(params: GammaCreateParams): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/generations`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      inputText:  params.inputText,
      textMode:   'generate',
      format:     'document',
      exportAs:   'pdf',
      numCards:   params.numCards ?? 10,
      cardOptions: {
        dimensions: 'a4',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Gamma API ${res.status}: ${err}`)
  }

  const data = await res.json() as { generationId: string }
  return { id: data.generationId }
}

export async function getGenerationStatus(generationId: string): Promise<GammaGenerationStatus> {
  const res = await fetch(`${BASE}/generations/${generationId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`Gamma API ${res.status}: ${err}`)
  }

  const data = await res.json() as GammaGenerationStatus
  return data
}
