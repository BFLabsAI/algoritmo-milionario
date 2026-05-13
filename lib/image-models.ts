// Todos suportam image output via OpenRouter /chat/completions (sem modalities param)
export const IMAGE_MODEL_CATALOG = [
  { slug: 'black-forest-labs/flux.2-pro',            display_name: 'Flux 2 Pro',          badge: 'Premium'  },
  { slug: 'google/gemini-2.5-flash-image',           display_name: 'Gemini Flash Image',   badge: 'Rápido'   },
  { slug: 'sourceful/riverflow-v2-standard-preview', display_name: 'Riverflow 2',          badge: 'Novo'     },
  { slug: 'bytedance-seed/seedream-4.5',             display_name: 'Seedream 4.5',         badge: 'Novo'     },
  { slug: 'openai/gpt-5-image-mini',                 display_name: 'GPT-5 Image Mini',     badge: 'Econômico'},
] as const

export type ImageModelSlug = typeof IMAGE_MODEL_CATALOG[number]['slug']

export const IMAGE_ALLOWED_SLUGS = IMAGE_MODEL_CATALOG.map(m => m.slug)
