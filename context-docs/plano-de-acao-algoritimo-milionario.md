## 1. BACK-END — Supabase

### 1.1 Arquitetura Geral

```
[Usuário/Browser]
      │
      ▼
[Next.js App Server]  ◄── Server Actions / Route Handlers
      │                          │
      ├── Supabase Client        └── OpenRouter API  (server-side only)
      │   (service_role,              ↓
      │    nunca exposta)         Rota unificada para todos os modelos:
      ▼                          GPT-4o / Claude / Gemini / DeepSeek / etc.
[Supabase PostgreSQL]
```

O **OpenRouter** funciona como gateway unificado. Uma única chave de API no servidor dá acesso a todos os modelos. O front-end nunca vê nenhuma credencial.

---

### 1.2 Tabelas do Banco de Dados

#### `plans_algoritmo_milionario`
Tabela mestre de planos. Configurável via painel admin, sem re-deploy.

```sql
CREATE TABLE public.plans_algoritmo_milionario (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL UNIQUE,    -- 'free', 'pro', 'premium'
  display_name        TEXT NOT NULL,           -- 'Gratuito', 'Pro', 'Premium'
  price_brl           NUMERIC(10,2),

  -- Limites mensais (NULL = ilimitado)
  limit_chat_messages INT,
  limit_images        INT,
  limit_ebooks        INT,
  limit_experts_uses  INT,

  -- Features habilitadas (slugs)
  features            TEXT[] DEFAULT '{}',
  -- ['chat','images','ebooks','experts','prompts']

  -- JSONB para modelos: permite metadados ricos por modelo
  allowed_models      JSONB DEFAULT '[]'::JSONB,
  /*
    Exemplo de estrutura:
    [
      {
        "slug": "openai/gpt-4o",
        "display_name": "GPT-4o",
        "provider": "OpenAI",
        "max_tokens": 128000,
        "is_reasoning": false,
        "badge": "Favorito"
      },
      {
        "slug": "anthropic/claude-sonnet-4-5",
        "display_name": "Claude Sonnet 4.5",
        "provider": "Anthropic",
        "max_tokens": 200000,
        "is_reasoning": false,
        "badge": "Mais usado"
      },
      {
        "slug": "google/gemini-2.5-pro",
        "display_name": "Gemini 2.5 Pro",
        "provider": "Google",
        "max_tokens": 1000000,
        "is_reasoning": false,
        "badge": null
      },
      {
        "slug": "deepseek/deepseek-v3",
        "display_name": "DeepSeek V3",
        "provider": "DeepSeek",
        "max_tokens": 64000,
        "is_reasoning": true,
        "badge": null
      }
    ]
  */

  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### `profiles_algoritmo_milionario`
Extensão de `auth.users`. Criada automaticamente via trigger.

```sql
CREATE TABLE public.profiles_algoritmo_milionario (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  avatar_url      TEXT,
  plan_id         UUID REFERENCES plans_algoritmo_milionario(id),
  plan_expires_at TIMESTAMPTZ,   -- NULL = free (sem expiração por upgrade)
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `usage_counters_algoritmo_milionario`
Contador de uso por usuário + período (mês).

```sql
CREATE TABLE public.usage_counters_algoritmo_milionario (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period           TEXT NOT NULL,       -- formato: '2026-04'
  chat_messages    INT DEFAULT 0,
  images_generated INT DEFAULT 0,
  ebooks_generated INT DEFAULT 0,
  experts_uses     INT DEFAULT 0,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);
```

#### `conversations_algoritmo_milionario`
**Uma linha = uma conversa inteira.** Guarda metadados da conversa, não as mensagens.

```sql
CREATE TABLE public.conversations_algoritmo_milionario (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT,           -- gerado pela IA na 1ª mensagem
  agent_id    UUID REFERENCES agents_algoritmo_milionario(id),
  model_slug  TEXT NOT NULL,  -- modelo ativo nessa conversa (ex: 'openai/gpt-4o')
  is_pinned   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()   -- atualizado a cada nova mensagem
);

-- Índice para listar conversas do usuário ordenadas por data
CREATE INDEX idx_conversations_user_updated
  ON public.conversations_algoritmo_milionario(user_id, updated_at DESC);
```

#### `messages_algoritmo_milionario`
**Uma linha = uma mensagem.** Esta tabela é o coração do chat e precisa existir separada.

Por que não no JSONB de conversations? Porque aqui você consegue:
- Buscar apenas as últimas N mensagens (paginação real)
- Saber quantos tokens cada mensagem consumiu
- Fazer streaming via Supabase Realtime por linha
- Indexar e buscar conteúdo no futuro (full-text search)

```sql
CREATE TABLE public.messages_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL
    REFERENCES conversations_algoritmo_milionario(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  tokens_used     INT,        -- tokens consumidos (analytics e controle de custo)
  model_slug      TEXT,       -- modelo que gerou (pode mudar ao longo da conversa)
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para carregar mensagens de uma conversa em ordem
CREATE INDEX idx_messages_conversation
  ON public.messages_algoritmo_milionario(conversation_id, created_at ASC);

-- Índice para deletar todas as mensagens de um usuário eficientemente
CREATE INDEX idx_messages_user
  ON public.messages_algoritmo_milionario(user_id);
```

#### `agents_algoritmo_milionario`
Biblioteca de agentes/experts. System prompts nunca saem do servidor.

```sql
CREATE TABLE public.agents_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,   -- 'ashterion', 'amanda-ads'
  name            TEXT NOT NULL,
  description     TEXT,
  avatar_url      TEXT,
  system_prompt   TEXT NOT NULL,          -- NUNCA retornado ao front-end
  default_model   TEXT NOT NULL,          -- ex: 'anthropic/claude-sonnet-4-5'
  category        TEXT,                   -- 'copywriting','ads','email','reels'
  is_official     BOOLEAN DEFAULT TRUE,
  is_active       BOOLEAN DEFAULT TRUE,
  required_plan   TEXT DEFAULT 'free',    -- plano mínimo para acessar
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `generated_images_algoritmo_milionario`
Imagens geradas por IA, vinculadas ao usuário **e opcionalmente à conversa de origem**.

```sql
CREATE TABLE public.generated_images_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Vínculo opcional com a conversa que originou a geração
  conversation_id UUID REFERENCES conversations_algoritmo_milionario(id) ON DELETE SET NULL,
  prompt          TEXT NOT NULL,
  storage_path    TEXT NOT NULL,   -- path no Supabase Storage (bucket privado)
  model_used      TEXT,            -- ex: 'dall-e-3', 'flux-1', 'openrouter/...'
  width           INT,
  height          INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_images_user
  ON public.generated_images_algoritmo_milionario(user_id, created_at DESC);
```

#### `generated_ebooks_algoritmo_milionario`
Ebooks gerados, vinculados ao usuário.

```sql
CREATE TABLE public.generated_ebooks_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  theme           TEXT DEFAULT 'breeze',
  page_count      INT DEFAULT 10,
  tone            TEXT DEFAULT 'professional',
  target_audience TEXT,
  language        TEXT DEFAULT 'pt-BR',
  storage_path    TEXT,    -- path no Supabase Storage após geração
  status          TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','generating','done','error')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gen_ebooks_user
  ON public.generated_ebooks_algoritmo_milionario(user_id, created_at DESC);
```

#### `prompts_algoritmo_milionario`
Biblioteca de prompts prontos (gerenciável via admin).

```sql
CREATE TABLE public.prompts_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  content       TEXT NOT NULL,      -- conteúdo completo do prompt
  category      TEXT,
  model_slug    TEXT,               -- modelo recomendado para este prompt
  required_plan TEXT DEFAULT 'free',
  is_active     BOOLEAN DEFAULT TRUE,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### `subscriptions_algoritmo_milionario`
Histórico de compras e assinaturas (webhooks de Kiwify, Hotmart, etc.).

```sql
CREATE TABLE public.subscriptions_algoritmo_milionario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES plans_algoritmo_milionario(id),
  provider        TEXT NOT NULL,   -- 'kiwify', 'hotmart', 'stripe', 'manual'
  provider_sub_id TEXT,            -- ID da assinatura no provider externo
  status          TEXT NOT NULL
                  CHECK (status IN ('active','cancelled','expired','pending')),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  metadata        JSONB            -- dados brutos do webhook para auditoria
);
```

---

### 1.3 Relacionamento entre Tabelas (Diagrama)

```
auth.users
    │
    ├──(1:1)──► profiles_algoritmo_milionario ──► plans_algoritmo_milionario
    │
    ├──(1:N)──► conversations_algoritmo_milionario
    │               │
    │               └──(1:N)──► messages_algoritmo_milionario
    │
    ├──(1:N)──► usage_counters_algoritmo_milionario
    ├──(1:N)──► generated_images_algoritmo_milionario ──► conversations (opcional)
    ├──(1:N)──► generated_ebooks_algoritmo_milionario
    └──(1:N)──► subscriptions_algoritmo_milionario ──► plans_algoritmo_milionario

agents_algoritmo_milionario ◄──── conversations_algoritmo_milionario (opcional)
prompts_algoritmo_milionario (independente, somente leitura pelo usuário)
```

---

### 1.4 Row Level Security (RLS)

```sql
-- ============================================================
-- REGRA DE OURO: RLS em TODAS as tabelas sem exceção
-- ============================================================

ALTER TABLE public.profiles_algoritmo_milionario      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations_algoritmo_milionario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages_algoritmo_milionario       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_ebooks_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_algoritmo_milionario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_algoritmo_milionario          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents_algoritmo_milionario         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts_algoritmo_milionario        ENABLE ROW LEVEL SECURITY;

-- ---- profiles -----------------------------------------------
CREATE POLICY "profile: usuário lê o próprio"
  ON public.profiles_algoritmo_milionario FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profile: usuário atualiza o próprio"
  ON public.profiles_algoritmo_milionario FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profile: service_role faz tudo"
  ON public.profiles_algoritmo_milionario FOR ALL
  USING (auth.role() = 'service_role');

-- ---- conversations ------------------------------------------
CREATE POLICY "conv: usuário acessa as próprias"
  ON public.conversations_algoritmo_milionario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- messages -----------------------------------------------
CREATE POLICY "msg: usuário acessa as próprias"
  ON public.messages_algoritmo_milionario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- usage_counters -----------------------------------------
CREATE POLICY "usage: usuário lê o próprio"
  ON public.usage_counters_algoritmo_milionario FOR SELECT
  USING (auth.uid() = user_id);

-- Incremento só via service_role (server-side)
CREATE POLICY "usage: service_role escreve"
  ON public.usage_counters_algoritmo_milionario FOR ALL
  USING (auth.role() = 'service_role');

-- ---- generated_images / generated_ebooks --------------------
CREATE POLICY "img: usuário acessa as próprias"
  ON public.generated_images_algoritmo_milionario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ebook: usuário acessa os próprios"
  ON public.generated_ebooks_algoritmo_milionario FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- subscriptions ------------------------------------------
CREATE POLICY "sub: usuário lê as próprias"
  ON public.subscriptions_algoritmo_milionario FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sub: service_role gerencia"
  ON public.subscriptions_algoritmo_milionario FOR ALL
  USING (auth.role() = 'service_role');

-- ---- plans / agents / prompts (leitura para autenticados) ---
CREATE POLICY "plans: leitura para autenticados"
  ON public.plans_algoritmo_milionario FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "agents: leitura para autenticados"
  ON public.agents_algoritmo_milionario FOR SELECT
  -- IMPORTANTE: system_prompt NUNCA é retornado (filtrado na API Route, não aqui)
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "prompts: leitura para autenticados"
  ON public.prompts_algoritmo_milionario FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);
```

---

### 1.5 Funções e Triggers

```sql
-- Trigger: cria profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles_algoritmo_milionario (id, full_name, avatar_url, plan_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    (SELECT id FROM public.plans_algoritmo_milionario WHERE name = 'free' LIMIT 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função: incrementa contador de uso (chamada server-side via service_role)
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id UUID,
  p_feature TEXT  -- 'chat_messages' | 'images_generated' | 'ebooks_generated' | 'experts_uses'
)
RETURNS VOID AS $$
DECLARE
  v_period TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO public.usage_counters_algoritmo_milionario (user_id, period)
  VALUES (p_user_id, v_period)
  ON CONFLICT (user_id, period) DO NOTHING;

  EXECUTE FORMAT(
    'UPDATE public.usage_counters_algoritmo_milionario
     SET %I = %I + 1, updated_at = NOW()
     WHERE user_id = $1 AND period = $2',
    p_feature, p_feature
  ) USING p_user_id, v_period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: verifica se usuário está dentro do limite de uso
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period       TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_plan_limit   INT;
  v_current_use  INT;
BEGIN
  SELECT
    CASE p_feature
      WHEN 'chat_messages'    THEN p.limit_chat_messages
      WHEN 'images_generated' THEN p.limit_images
      WHEN 'ebooks_generated' THEN p.limit_ebooks
      WHEN 'experts_uses'     THEN p.limit_experts_uses
    END
  INTO v_plan_limit
  FROM public.profiles_algoritmo_milionario pr
  JOIN public.plans_algoritmo_milionario p ON p.id = pr.plan_id
  WHERE pr.id = p_user_id;

  IF v_plan_limit IS NULL THEN RETURN TRUE; END IF;  -- NULL = ilimitado

  EXECUTE FORMAT(
    'SELECT COALESCE(%I, 0)
     FROM public.usage_counters_algoritmo_milionario
     WHERE user_id = $1 AND period = $2',
    p_feature
  ) INTO v_current_use USING p_user_id, v_period;

  RETURN COALESCE(v_current_use, 0) < v_plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 1.6 Storage Buckets

```
Supabase Storage:
├── avatars/                    → público
└── user-content/               → privado (acesso via Signed URL com TTL curto)
    ├── images/{user_id}/{uuid}.webp
    └── ebooks/{user_id}/{uuid}.pdf
```

Acesso ao conteúdo gerado ocorre exclusivamente via **Signed URLs** geradas server-side com expiração de 15 minutos. Nunca URLs públicas permanentes.

---

## 2. OPENROUTER — Integração Unificada com Modelos de IA

### 2.1 O Que é o OpenRouter

O OpenRouter é um gateway de API que unifica o acesso a todos os grandes modelos (OpenAI, Anthropic, Google, DeepSeek, Mistral, Meta, etc.) em um único endpoint compatível com o formato da OpenAI. Em vez de gerenciar múltiplos SDKs e múltiplas chaves de API, você usa **uma única chave e uma única base URL**.

```
SEM OpenRouter:
  Servidor → OpenAI SDK  (chave OPENAI_API_KEY)
  Servidor → Anthropic SDK (chave ANTHROPIC_API_KEY)
  Servidor → Google SDK   (chave GOOGLE_API_KEY)
  → 3 SDKs, 3 chaves, 3 formatos de resposta diferentes

COM OpenRouter:
  Servidor → OpenRouter API (chave OPENROUTER_API_KEY)
             └── internamente roteia para OpenAI / Anthropic / Google / etc.
  → 1 SDK, 1 chave, 1 formato de resposta
```

### 2.2 Configuração no Servidor

```typescript
// lib/openrouter.ts — NUNCA importar no cliente
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,  // NUNCA em NEXT_PUBLIC_
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,  // identificação do app
    'X-Title': 'BF Labs AI Hub',
  },
})
```

### 2.3 Slugs dos Modelos no OpenRouter

Os slugs salvos em `plans_algoritmo_milionario.allowed_models` e usados nas conversas:

| Modelo | Slug OpenRouter |
|---|---|
| Million AI 1.0 (modelo próprio/custom) | `openai/gpt-4o` + system prompt especial |
| Claude Sonnet 4.5 | `anthropic/claude-sonnet-4-5` |
| GPT-4o | `openai/gpt-4o` |
| Gemini 2.5 Pro | `google/gemini-2.5-pro` |
| DeepSeek V3 | `deepseek/deepseek-v3` |

### 2.4 Fluxo de Chat com Streaming via OpenRouter

```typescript
// app/api/chat/route.ts — Route Handler server-side
import { openrouter } from '@/lib/openrouter'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const ChatSchema = z.object({
  message:        z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  model:          z.string().min(1),   // ex: 'anthropic/claude-sonnet-4-5'
  agentId:        z.string().uuid().optional(),
})

export async function POST(req: Request) {
  const supabase = createSupabaseAdmin()

  // 1. Valida sessão do usuário
  const { data: { user } } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  )
  if (!user) return new Response('Unauthorized', { status: 401 })

  // 2. Valida payload
  const body = await req.json()
  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) return new Response('Invalid payload', { status: 400 })

  const { message, conversationId, model, agentId } = parsed.data

  // 3. Verifica se o modelo está no plano do usuário
  const { data: profile } = await supabase
    .from('profiles_algoritmo_milionario')
    .select('plans_algoritmo_milionario(allowed_models)')
    .eq('id', user.id)
    .single()

  const allowedModels = profile?.plans_algoritmo_milionario?.allowed_models ?? []
  const modelAllowed = allowedModels.some((m: any) => m.slug === model)
  if (!modelAllowed) return new Response('Model not in your plan', { status: 403 })

  // 4. Verifica limite de uso
  const { data: withinLimit } = await supabase.rpc('check_usage_limit', {
    p_user_id: p_user_id,
    p_feature: 'chat_messages'
  })
  if (!withinLimit) return new Response('Monthly limit reached', { status: 429 })

  // 5. Busca system prompt do agente (se houver)
  let systemPrompt = 'Você é um assistente de IA útil e preciso.'
  if (agentId) {
    const { data: agent } = await supabase
      .from('agents_algoritmo_milionario')
      .select('system_prompt')   // nunca retornado ao front-end
      .eq('id', agentId)
      .single()
    if (agent) systemPrompt = agent.system_prompt
  }

  // 6. Busca histórico da conversa (últimas 20 msgs para contexto)
  let history: any[] = []
  if (conversationId) {
    const { data: msgs } = await supabase
      .from('messages_algoritmo_milionario')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)
    history = msgs ?? []
  }

  // 7. Chama OpenRouter com stream
  const stream = await openrouter.chat.completions.create({
    model,
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ],
  })

  // 8. Retorna ReadableStream para o front-end
  const readable = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      let totalTokens = 0

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        fullResponse += text
        totalTokens = chunk.usage?.total_tokens ?? totalTokens
        controller.enqueue(new TextEncoder().encode(text))
      }

      // 9. Após stream: salva mensagem no banco + incrementa uso
      await Promise.all([
        supabase.from('messages_algoritmo_milionario').insert([
          { conversation_id: conversationId, user_id: user.id,
            role: 'user', content: message },
          { conversation_id: conversationId, user_id: user.id,
            role: 'assistant', content: fullResponse,
            tokens_used: totalTokens, model_slug: model }
        ]),
        supabase.rpc('increment_usage', {
          p_user_id: user.id,
          p_feature: 'chat_messages'
        })
      ])

      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    }
  })
}
```

### 2.5 "Million AI 1.0" — Modelo Próprio

O modelo "Million AI 1.0" que aparece na interface não é necessariamente um modelo treinado do zero. É um **GPT-4o (ou Claude) com um system prompt proprietário** que define personalidade, tom e conhecimentos específicos da plataforma. No OpenRouter, você simplesmente usa o modelo base e injeta o system prompt customizado.

```typescript
// Se o model selecionado for 'million-ai-1.0', mapeia internamente:
const MILLION_AI_CONFIG = {
  openrouter_model: 'openai/gpt-4o',
  system_prompt: `Você é a Million AI, uma inteligência artificial especializada
  em criação de infoprodutos, copywriting e marketing digital brasileiro...
  [prompt proprietário completo aqui]`
}
```

---

## 3. FRONT-END — Next.js 14+ (App Router)

### 3.1 Estrutura de Rotas

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
│
├── (app)/                          → layout com sidebar (requer sessão)
│   ├── layout.tsx
│   ├── page.tsx                    → /    Hub/Dashboard
│   ├── chat/
│   │   ├── page.tsx                → /chat        nova conversa
│   │   └── [id]/page.tsx           → /chat/[id]   conversa existente
│   ├── imagens/
│   │   ├── page.tsx                → /imagens
│   │   └── [id]/page.tsx           → /imagens/[id]
│   ├── ebooks/
│   │   ├── page.tsx                → /ebooks
│   │   └── [id]/page.tsx           → /ebooks/[id]
│   ├── experts/page.tsx            → /experts
│   ├── prompts/page.tsx            → /prompts
│   └── configuracoes/page.tsx      → /configuracoes
│
├── api/
│   ├── chat/route.ts               → streaming via OpenRouter
│   ├── images/generate/route.ts    → geração de imagens
│   ├── ebooks/generate/route.ts    → geração de ebooks (PDF)
│   ├── usage/route.ts              → consulta de uso atual
│   └── webhooks/
│       ├── kiwify/route.ts
│       └── hotmart/route.ts
│
└── middleware.ts                   → proteção de rotas
```

### 3.2 Design System — Dark Mode

```css
/* globals.css */
:root {
  --bg:           #0d0d0d;
  --surface:      #1a1a1a;
  --surface-2:    #222222;
  --surface-3:    #2a2a2a;
  --border:       rgba(255,255,255,0.08);
  --text:         #e5e5e5;
  --text-muted:   #888888;
  --text-faint:   #444444;
  --accent:       #3b82f6;
  --accent-hover: #2563eb;
  --accent-teal:  #0ea5e9;
  --accent-purple: #8b5cf6;
  --success:      #22c55e;
  --error:        #ef4444;
  --warning:      #f59e0b;
  --radius-sm:    8px;
  --radius-md:    12px;
  --radius-lg:    16px;
  --radius-xl:    20px;
}
```

### 3.3 Verificação de Plano — Camadas de Proteção

```
Camada 1 — UI (front-end):
  Exibe badge "8/10 imagens", desabilita botão visualmente.
  → Apenas UX, NÃO é segurança.

Camada 2 — Route Handler (servidor):
  check_usage_limit() antes de qualquer chamada à IA.
  Retorna 429 se limite atingido.
  → Segurança real.

Camada 3 — RLS (banco de dados):
  Mesmo com service_role bypassado por erro de código,
  o RLS garante que o usuário só acessa seus próprios dados.
  → Última linha de defesa.
```

---

## 4. SEGURANÇA

### 4.1 Zero Exposição no Cliente

| Segredo | Onde fica | Exposto? |
|---|---|---|
| `OPENROUTER_API_KEY` | `.env` server-side | ❌ Nunca |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env` server-side | ❌ Nunca |
| `KIWIFY_WEBHOOK_SECRET` | `.env` server-side | ❌ Nunca |
| System prompts dos agentes | Banco de dados, filtrado na API | ❌ Nunca |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env` público | ✅ Seguro (URL pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env` público | ✅ Seguro (RLS protege) |

### 4.2 Rate Limiting por Usuário

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const chatRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'),  // 20 msgs por minuto por usuário
  prefix: 'rl:chat'
})

// Uso na Route Handler:
const { success } = await chatRateLimit.limit(user.id)
if (!success) return new Response('Too many requests', { status: 429 })
```

### 4.3 Validação com Zod em Todas as Entradas

```typescript
// Nenhum dado do cliente é confiado sem validação
const ChatSchema = z.object({
  message:        z.string().min(1).max(4000).trim(),
  conversationId: z.string().uuid().optional(),
  model:          z.enum([
    'million-ai-1.0',
    'openai/gpt-4o',
    'anthropic/claude-sonnet-4-5',
    'google/gemini-2.5-pro',
    'deepseek/deepseek-v3',
  ]),
})
```

### 4.4 Proteção de Webhooks (HMAC)

```typescript
// /api/webhooks/kiwify/route.ts
import { createHmac, timingSafeEqual } from 'crypto'

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('x-kiwify-signature') ?? ''

  const expected = createHmac('sha256', process.env.KIWIFY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  // timingSafeEqual previne timing attacks
  const match = timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  if (!match) return new Response('Forbidden', { status: 403 })

  const payload = JSON.parse(body)
  // Atualiza plano do usuário via service_role...
}
```

### 4.5 Security Headers

```typescript
// next.config.ts
const headers = [
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai",
      "font-src 'self' https://fonts.gstatic.com",
    ].join('; ')
  }
]
```

---

## 5. STACK TÉCNICA FINAL

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (customizado dark) |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Gateway de IA | OpenRouter (1 chave → todos os modelos) |
| Validação | Zod |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Geração de PDF | Puppeteer (server-side) |
| Pagamentos | Kiwify / Hotmart (webhooks HMAC) |
| Deploy | Vercel + Supabase Cloud |
| Monitoramento | Vercel Analytics + Supabase Dashboard |

---

## 6. ROADMAP DE DESENVOLVIMENTO

| Fase | Entregáveis | Sprint |
|---|---|---|
| **Fundação** | Setup Next.js + Supabase, todas as tabelas + RLS, auth completo, middleware, layout base dark | 1-2 |
| **Chat Core** | Chat com streaming via OpenRouter, seletor de modelos, histórico de conversas, agents/experts | 3-4 |
| **Geração** | Gerador de imagens, gerador de ebooks (PDF), contador de uso, gates de plano | 5-6 |
| **Biblioteca** | Prompts prontos, página de configurações, perfil do usuário | 7 |
| **Monetização** | Webhooks Kiwify/Hotmart, upgrade de plano, rate limiting, security headers | 8-9 |
| **Produção** | Pentest (Burp Suite), load test, monitoramento, deploy final | 10 |

---