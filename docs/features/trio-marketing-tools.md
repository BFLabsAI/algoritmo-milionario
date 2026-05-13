# Trio de Ferramentas de Marketing — Plano de Implementação

**Data:** 2026-04-30  
**Status:** Em desenvolvimento  
**Autor:** CTO (ScaleAI)

---

## Visão Geral

Três ferramentas estruturadas de alto valor para profissionais de marketing direto e criadores de infoprodutos. Não são chats — são interfaces visuais com input estruturado, geração via AI e persistência de dados.

---

## Feature 1 — Social Media Planner

### O que é
O usuário informa: nome do produto, informações da oferta, público-alvo, diferenciais, duração (15 ou 30 dias) e data de início. O sistema gera um **plano visual completo** com:
- 3 posts/semana (Reel + Feed + Carousel, distribuídos ao longo da semana)
- 3 Stories/dia
- Calendário visual editável
- Cada item marcável como "feito"
- Progress bar do plano

### Rota dashboard
`/dashboard/planejador`

### Schema DB

```sql
CREATE TABLE social_media_plans_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  product_name  TEXT NOT NULL,
  offer_info    TEXT,
  target_audience TEXT,
  differentials TEXT,
  duration_days INT NOT NULL CHECK (duration_days IN (15, 30)),
  start_date    DATE NOT NULL,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','completed')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE social_media_plan_items_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID NOT NULL REFERENCES social_media_plans_algoritmo_milionario(id) ON DELETE CASCADE,
  day_number    INT NOT NULL,           -- 1..30
  scheduled_date DATE,                  -- calculado a partir de start_date
  content_type  TEXT NOT NULL CHECK (content_type IN ('reel','feed','carousel','story')),
  slot_number   INT NOT NULL DEFAULT 1, -- stories: 1-3; posts: 1 per type per week
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,          -- copy/roteiro do conteúdo
  caption       TEXT,                   -- legenda + hashtags
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','done','skipped')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE social_media_plans_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_plan_items_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
-- Policies: user reads/writes own; service_role all
```

### API Routes

```
POST   /api/social-planner              → Cria plano + dispara geração AI (retorna plan_id)
GET    /api/social-planner              → Lista planos do usuário
GET    /api/social-planner/[id]         → Plano completo com todos os itens
PATCH  /api/social-planner/[id]         → Atualiza start_date ou status do plano
PATCH  /api/social-planner/[id]/items/[itemId] → Marca item como done/pending/skipped
DELETE /api/social-planner/[id]         → Exclui plano
```

### AI Generation — System Prompt Outline
- Persona: Gary Vaynerchuk + Érico Rocha (distribuição de conteúdo, lançamentos)
- Output: JSON estruturado com `days[]`, cada dia com `posts[]` e `stories[]`
- Distribuição de posts: Reel (segunda), Feed (quarta), Carousel (sexta) — rotação semanal
- Stories: 3 por dia com objetivos distintos (conexão, conteúdo, CTA)
- Formato de output JSON:
```json
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
```

### UI — Componentes principais
- `PlannerForm` — wizard de criação (inputs + seleção de duração/data)
- `PlannerCalendar` — grid semanal visual (linhas = semanas, colunas = dias)
- `PlannerCard` — card de cada item (expand para ver conteúdo, botão "feito")
- `PlannerProgress` — barra de progresso do plano
- `PlannerList` — lista de planos salvos na entrada da página

---

## Feature 2 — Criador de Produtos

### O que é
Wizard que coleta informações brutas sobre um produto e gera automaticamente todos os ativos de marketing: nome, headlines, mecanismo único, estrutura de VSL/TSL, order bump, upsell e downsell.

### Rota dashboard
`/dashboard/criador-produto`

### Schema DB

```sql
CREATE TABLE products_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Inputs do usuário
  raw_description TEXT,
  market        TEXT,
  price         NUMERIC(10,2),
  icp           TEXT,
  differentials TEXT,
  -- Outputs gerados por AI (tudo em JSONB para flexibilidade)
  product_name  TEXT,
  headlines     JSONB,  -- array de 4 strings
  description   TEXT,
  unique_mechanism JSONB, -- { problem_mechanism: TEXT, solution_mechanism: TEXT }
  social_proof_suggestions JSONB, -- array de sugestões de provas sociais
  vsl_structure JSONB,  -- array de seções { section_name, objective, key_points[] }
  tsl_structure JSONB,  -- idem para Text Sales Letter
  order_bump    JSONB,  -- { name, description, price_suggestion, why }
  upsell        JSONB,  -- { name, description, price_suggestion, positioning }
  downsell      JSONB,  -- { name, description, price_suggestion, positioning }
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','generated','saved')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
```

### API Routes

```
POST   /api/products              → Cria produto + dispara geração AI
GET    /api/products              → Lista produtos do usuário
GET    /api/products/[id]         → Produto completo
PUT    /api/products/[id]         → Atualiza (re-gerar ou salvar edições)
DELETE /api/products/[id]
```

### AI Generation — Output Structure
Agente: Alex Hormozi ($100M Offers) + Stefan Georgi (headlines/copy)
Output JSON:
```json
{
  "product_name": "...",
  "headlines": ["...", "...", "...", "..."],
  "description": "...",
  "unique_mechanism": {
    "problem_mechanism": "...",
    "solution_mechanism": "..."
  },
  "social_proof_suggestions": ["...", "..."],
  "vsl_structure": [
    { "section": "Hook", "objective": "...", "key_points": ["..."] },
    { "section": "História/Problema", "objective": "...", "key_points": ["..."] },
    { "section": "Mecanismo Único", "objective": "...", "key_points": ["..."] },
    { "section": "A Solução", "objective": "...", "key_points": ["..."] },
    { "section": "Oferta + Stack de Valor", "objective": "...", "key_points": ["..."] },
    { "section": "Garantia", "objective": "...", "key_points": ["..."] },
    { "section": "Fechamento + CTA", "objective": "...", "key_points": ["..."] }
  ],
  "order_bump": { "name": "...", "description": "...", "price_suggestion": "...", "why": "..." },
  "upsell": { "name": "...", "description": "...", "price_suggestion": "...", "positioning": "..." },
  "downsell": { "name": "...", "description": "...", "price_suggestion": "...", "positioning": "..." }
}
```

### UI — Componentes principais
- `ProductWizard` — form de inputs em 2 steps
- `ProductGenerating` — loading state com skeleton
- `ProductResult` — visualização completa por seções (tabs ou accordion)
  - Seção: Identidade (nome + headlines)
  - Seção: Mecanismo Único
  - Seção: VSL/TSL Structure
  - Seção: Funil (order bump + upsell + downsell)
- `ProductList` — lista de produtos salvos

---

## Feature 3 — Analisador de Oferta

### O que é
O usuário cola o texto de uma página de vendas (ou URL futuramente). O sistema faz uma análise completa estruturada da copy com scores por dimensão, raio-X completo e sugestões de modelagem.

### Rota dashboard
`/dashboard/analisador`

### Schema DB

```sql
CREATE TABLE offer_analyses_algoritmo_milionario (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url    TEXT,                -- opcional
  source_text   TEXT NOT NULL,       -- texto da página colado pelo usuário
  analysis      JSONB,               -- análise completa estruturada
  scores        JSONB,               -- scores por dimensão
  modeling_suggestions JSONB,        -- sugestões de modelagem
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offer_analyses_algoritmo_milionario ENABLE ROW LEVEL SECURITY;
```

### API Routes

```
POST   /api/offer-analysis         → Cria análise + dispara geração AI
GET    /api/offer-analysis         → Lista análises do usuário
GET    /api/offer-analysis/[id]    → Análise completa
DELETE /api/offer-analysis/[id]
```

### AI Generation — Analysis Dimensions
Agente: Stefan Georgi (RMBC) + Alex Hormozi ($100M Offers)
Output JSON:
```json
{
  "summary": "...",
  "scores": {
    "hook_strength": { "score": 8, "max": 10, "comment": "..." },
    "clarity_of_problem": { "score": 7, "max": 10, "comment": "..." },
    "unique_mechanism": { "score": 6, "max": 10, "comment": "..." },
    "offer_stack_value": { "score": 9, "max": 10, "comment": "..." },
    "social_proof": { "score": 5, "max": 10, "comment": "..." },
    "guarantee_strength": { "score": 7, "max": 10, "comment": "..." },
    "cta_effectiveness": { "score": 8, "max": 10, "comment": "..." },
    "urgency_scarcity": { "score": 4, "max": 10, "comment": "..." }
  },
  "xray": {
    "hook_type": "...",
    "identified_mechanism": "...",
    "offer_elements": ["...", "..."],
    "missing_elements": ["...", "..."],
    "copywriting_frameworks_detected": ["..."]
  },
  "modeling_suggestions": [
    { "dimension": "Hook", "current": "...", "suggestion": "...", "priority": "alta" },
    ...
  ]
}
```

### UI — Componentes principais
- `OfferInput` — textarea grande + opção de URL (fase 2)
- `OfferAnalyzing` — loading com skeleton e etapas visuais
- `OfferScoreCard` — grid de scores com visual de radar/barras
- `OfferXray` — accordion com cada dimensão da análise
- `ModelingSuggestions` — lista priorizada de melhorias
- `AnalysisList` — histórico de análises anteriores

---

## Sidebar — Novos itens

Adicionar ao `components/Sidebar.tsx`:
```
{ label: 'Planejador Social', href: '/dashboard/planejador', icon: CalendarDays }
{ label: 'Criador de Produtos', href: '/dashboard/criador-produto', icon: Lightbulb }
{ label: 'Analisador de Oferta', href: '/dashboard/analisador', icon: ScanSearch }
```

---

## Sequência de Implementação

### Wave 1 — Paralelo (não dependem entre si)
1. **supabase-wizard**: Criar migration `004_trio_marketing_tools.sql` com todos os schemas + RLS policies
2. **ai-builder-manager**: Implementar lógica de geração AI para as 3 ferramentas (system prompts + JSON parsing + handlers)

### Wave 2 — Paralelo (dependem da Wave 1)
3. **core-builder**: Implementar todos os API routes (`/api/social-planner`, `/api/products`, `/api/offer-analysis`)
4. **interface-artist**: Implementar todas as páginas e componentes UI

### Wave 3 — Integração
5. **debug-specialist**: Testes end-to-end e correção de bugs
6. **Sidebar update**: Adicionar novos itens de navegação

---

## Padrão arquitetural compartilhado

Todas as features seguem o mesmo padrão:
1. Form wizard coleta inputs → valida → POST para API
2. API route valida auth + plano do usuário → chama OpenRouter com prompt especializado
3. Response streamada ou aguardada (dependendo do tamanho) → parse JSON → salva no banco
4. Frontend recebe o resultado → renderiza componentes visuais especializados

**Reutilizar:** `createAdminClient()` para writes, Bearer token auth (padrão existente), `usage_counters` para rate limiting.

---

## Gating por plano

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Planejador Social | 1 plano / mês | 5 planos / mês | Ilimitado |
| Criador de Produtos | 2 / mês | 20 / mês | Ilimitado |
| Analisador de Oferta | 1 / mês | 10 / mês | Ilimitado |
