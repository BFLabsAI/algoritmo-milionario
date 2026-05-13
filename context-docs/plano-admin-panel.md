# Plano de Admin Panel + Sistema de Planos + Analytics

> **Status**: Diagnóstico completo + roadmap pronto para execução
> **Auditoria**: Schema Supabase (12 migrations) + app code (lib/, api/, components/) + pesquisa de analytics
> **Stack**: Next.js 16 (App Router) · Supabase (Auth + Postgres + RLS) · Kiwify/Hotmart webhooks
> **Data**: 2026-05-13

---

## 1. TL;DR em duas frases

O banco já tem **planos e assinaturas modelados** (3 planos seed: `free` / `pro` R$47 / `premium` R$97 + tabela `subscriptions_*` com status), mas **não existe nada de admin** no schema nem no código — zero coluna `role`/`is_admin`, zero policy RLS para admins, zero rota `/admin`. Para entregar o que você descreveu, precisamos **7 migrations** (admin, RLS, status, refunds, tracking, auditoria, índices), **1 novo módulo `lib/auth/`** com `requireAdmin()`, **fix dos webhooks** (são stubs de 29 linhas com TODOs), e **PostHog Cloud EU + materialized views no Supabase** para alimentar o dashboard de métricas.

---

## 2. Estado Atual (auditoria consolidada)

### 2.1 O que JÁ existe no banco

| Tabela | Para que serve | Status |
|---|---|---|
| `plans_algoritmo_milionario` | Planos: free / pro / premium (`001:5`) | ✅ Completo + seeded |
| `profiles_algoritmo_milionario` | Profile do usuário (`001:49`) | ⚠️ Falta `role`, `last_active_at`, `email` |
| `subscriptions_algoritmo_milionario` | Assinatura por usuário (`001:136`) | ⚠️ Status incompleto, sem `price_brl_snapshot`, sem campos de refund |
| `usage_counters_algoritmo_milionario` | Contadores por mês (`001:91`) | ✅ OK; usado via `check_usage_limit()` |

**Seed de planos atual** (`001:346-355`):
- `free` — R$ 0
- `pro` — R$ 47 (chat / imagens / ebooks / experts limitados)
- `premium` — R$ 97 (ilimitado)

**Função existente** (`001:307-340`): `check_usage_limit(p_user_id, p_counter)` — usa o `plan_id` da profile e os limites do plano para gating mensal. Não verifica `plan_expires_at` (bug silencioso descrito abaixo).

### 2.2 O que NÃO existe (gaps críticos)

#### Schema
- ❌ Coluna `role` ou `is_admin` em `profiles`. **Sem isso, admin não é representável.**
- ❌ Policy RLS para admin ler/escrever em outras profiles/subscriptions.
- ❌ Coluna `last_active_at` para alimentar DAU/MAU.
- ❌ Coluna `email` em profiles (precisa join em `auth.users` ou view `SECURITY DEFINER`).
- ❌ Tabela de auditoria (`admin_actions_*`) — sem log de quem mudou o quê.
- ❌ Tabela `page_views_*` (ou alternativa).
- ❌ `subscriptions.status` não inclui `past_due`, `trialing`, `paused`.
- ❌ `subscriptions.price_brl_snapshot` — MRR histórico quebra ao mudar preço do plano.
- ❌ Campos de refund (`refunded_at`, `refund_amount_brl`, `cancellation_reason`).
- ❌ Trigger que sincroniza `subscriptions.expires_at` → `profiles.plan_expires_at` e que faça downgrade automático.

#### Aplicação
- ❌ Zero referência a `is_admin` ou `role` em todo `app/`, `lib/`, `components/`.
- ❌ Sem rota `/admin/*`.
- ❌ Sem helper `requireAdmin()` / `getSessionContext()`.
- ❌ `proxy.ts` não gateia `/admin/*` (não existe ainda).

#### Webhooks (achados graves)
- `app/api/webhooks/kiwify/route.ts` (29 linhas) — verifica HMAC mas **só tem `// TODO: parse body and handle Kiwify webhook event` na linha 26**. Não escreve nada no banco.
- `app/api/webhooks/hotmart/route.ts` (29 linhas) — mesma estrutura, **mas a verificação está provavelmente errada**: trata `x-hotmart-hottok` como HMAC do body, quando o Hotmart normalmente envia um token estático compartilhado.
- Nenhum dos dois cria/atualiza `subscriptions` ou `profiles.plan_id`. Nenhum dos dois tem deduplicação de event_id.

#### Gating de feature por plano (atual ≠ desejado)
- `agents.required_plan` e `prompts.required_plan` existem no schema (`001:31, 43`).
- No app, são lidos só para **cosmético**: `components/ExpertCard.tsx:20` faz `const isPro = agent.required_plan !== 'free'` e mostra um badge "PRO".
- **Servidor nunca verifica** — em `app/api/chat/route.ts`, free users podem chamar `claude-opus-4` (que é `required_plan: 'pro'` em `lib/openrouter.ts:46-64`). Só o **contador mensal** é checado.
- Bug de drift: chat usa `check_usage_limit` / `increment_usage`; ebooks e images usam `check_usage_limit_am` / `increment_usage_am`. Provavelmente são funções diferentes — escolher uma e migrar.

#### `plan_expires_at` (bug silencioso)
- Existe a coluna (`profiles_algoritmo_milionario.plan_expires_at`).
- **Nenhum trigger, função ou app code consulta ela.** `check_usage_limit()` só lê `plan_id`. Resultado: se uma assinatura expira sem alguém atualizar `plan_id` manualmente, o usuário **continua usando o plano pago para sempre**.

---

## 3. Decisão Estratégica: Buy vs. Build (Analytics)

### 3.1 As duas naturezas distintas de métricas

O dashboard que você descreveu mistura **duas fontes de verdade** diferentes:

| Métrica | Fonte | Por quê |
|---|---|---|
| **MRR, churn, ARPU, assinaturas ativas** | **Supabase (DB)** | É verdade transacional: subscriptions × plans.price. Ferramenta de tracking não conhece o valor pago. |
| **DAU/MAU, páginas mais acessadas, retenção, funis** | **PostHog (SDK)** | É verdade comportamental: SDK captura no cliente. SQL puro seria gambiarra. |

**Erro comum**: tentar puxar MRR/churn do PostHog → você acaba duplicando event properties com valores monetários e fica desincronizado. **Mantenha as duas separadas.**

### 3.2 Recomendação: **PostHog Cloud EU** (Frankfurt)

Por quê esse e não outros:

- **Plausible / Umami**: só contam pageview. Não dão last-active, cohorts, retenção, funis, session replay. Vai dar trabalho migrar em 6 meses.
- **PostHog auto-hospedado**: 4 vCPU / 16 GB RAM mínimo + ClickHouse + ops de upgrade/backup → ~$100/mês + dor de cabeça. Free tier do Cloud cobre **1M eventos/mês + 5k session replays + 1M feature flag requests + 1 ano de retenção**.
- **PostHog Cloud EU** atende LGPD: data residency em Frankfurt, DPA assinável, IP capture desligado por padrão na EU.
- **Mixpanel**: cloud-only, sem EU residency garantida, mais caro depois do free tier.

**Custo até ~5k MAU**: R$ 0. Tempo de instalação: 1-2 horas (provider client + server + middleware).

### 3.3 Arquitetura do dashboard de métricas (revisada após decisão #9)

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard (Server Component em app/admin/page.tsx)   │
└──────────┬───────────────────────────────┬──────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│  Supabase                │    │  PostHog Cloud EU       │
│                          │    │                         │
│  Função SQL on-demand:   │    │  - DAU/WAU/MAU          │
│  compute_business_       │    │  - Top pageviews        │
│  metrics() retorna       │    │  - Cohorts, funnels     │
│  MRR, churn, ARPU        │    │  - Session replay       │
│  via SUM(price_brl_      │    │  - Per-user last_seen   │
│  snapshot) WHERE         │    │                         │
│  status='active'         │    │  Lido via posthog-node  │
│                          │    │  com unstable_cache(15m)│
│  Cache no Next.js com    │    │                         │
│  unstable_cache(15min)   │    │                         │
│                          │    │                         │
│  Webhook chama           │    │                         │
│  revalidatePath('/admin')│    │                         │
│  após cada inscrição/    │    │                         │
│  cancelamento → cache    │    │                         │
│  invalida instant\xE2neamente│    │                         │
└──────────────────────────┘    └─────────────────────────┘
```

**Por que não materialized view + pg_cron?**
- MRR é uma query simples (`SUM(price_brl_snapshot) WHERE status='active'`) que roda em milissegundos mesmo com 10k+ subscriptions.
- Event-driven (`revalidatePath()` no webhook) garante MRR sempre atualizado **na hora**, não em 15 min.
- Zero dependência de `pg_cron` (que exige Supabase Pro $25/mês).
- Cache no Next.js com `unstable_cache` protege contra hits frequentes no DB; revalidação manual via webhook reconcilia em tempo real.

**Taxonomia de eventos PostHog** (manter pequeno — 8 eventos):
1. `$pageview` (auto-captured)
2. `user_signed_up`
3. `user_signed_in`
4. `subscription_started` (server-side, no webhook)
5. `subscription_cancelled` (server-side)
6. `subscription_refunded` (server-side)
7. `feature_used` (com `{feature: "chat" | "image_gen" | "ebook_gen" | "social_planner"}`)
8. `checkout_completed`

Eventos críticos (signup, subscription_*) sempre **server-side** — eventos client-side podem ser bloqueados por adblock.

---

## 4. Roadmap de Execução

### Fase 0 — Decisões pendentes (antes de começar)

Veja a **Seção 8 (Perguntas em Aberto)** abaixo. Não dá pra escrever as migrations sem essas respostas.

### Fase 1 — Fundação de schema (1 dia)

Sete migrations sequenciais (`013` → `019`):

| Migration | Conteúdo | Por quê |
|---|---|---|
| `013_add_admin_role.sql` | `ALTER profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','superadmin'))` + função `is_admin(uid)` SECURITY DEFINER + index parcial | Base de tudo |
| `014_admin_rls_policies.sql` | Policies SELECT/UPDATE para admin em `profiles`, `subscriptions`, `usage_counters`, `generated_*`, trio marketing | Admin lê tudo via cliente normal (não service_role) |
| `015_subscription_status_expansion.sql` | Drop+recreate CHECK pra incluir `past_due`, `trialing`, `paused` + adicionar `trial_ends_at`, `current_period_start/end`, `refunded_at`, `refund_amount_brl`, `cancellation_reason`, `price_brl_snapshot` | Billing real + MRR histórico estável |
| `016_user_activity_tracking.sql` | `ALTER profiles ADD COLUMN last_active_at, last_sign_in_at` + decidir: criar `page_views_*` table OU só usar PostHog (ver Seção 8) | DAU + filtro "ativo nos últimos 7 dias" |
| `017_admin_audit_log.sql` | Tabela `admin_actions_*` (admin_id, target_user_id, action, before/after JSONB, notes) + RLS admin-only | Compliance + rastreabilidade |
| `018_enforce_plan_expiry.sql` | Trigger em `subscriptions` → mirror pra `profiles.plan_id` + `plan_expires_at`. Atualizar `check_usage_limit()` pra **retornar FALSE** quando `plan_expires_at < NOW()` (bloqueio total, não downgrade pra free). Adicionar status `'expired'` no enum (já feito em 015). | Fecha o bug do plano expirado com bloqueio total conforme decisão #7 |
| `019_admin_helper_indexes.sql` | `profiles(created_at DESC)`, `profiles(plan_id)`, `profiles(last_active_at DESC)`, `subscriptions(status, expires_at)`, `subscriptions(user_id, status)` | Listagens grandes não fazem full scan |

### Fase 2 — Helpers de auth + admin guard (0.5 dia)

Criar:

- **`lib/auth/session.ts`** — função `getSessionContext()` que retorna `{ user, profile, plan, isAdmin }` em uma única ida ao banco (join profiles+plans). Substitui o `supabase.auth.getUser()` repetido em todas as rotas.
- **`lib/auth/admin.ts`** — `requireAdmin()` server-side, lança 404 (não 403, pra não vazar a existência) se não-admin.
- **`proxy.ts`** — adicionar `ADMIN_PREFIXES = ['/admin', '/api/admin/']` na lógica de gating. Por enquanto, fazer o check no `app/admin/layout.tsx` mesmo (middleware fino).

### Fase 3 — Endurecer webhooks + billing pipeline (1.5 dias)

Este é o trabalho mais crítico — sem isso, o admin "gerenciar assinaturas" não tem nada pra gerenciar.

1. **Kiwify webhook** (`app/api/webhooks/kiwify/route.ts`)
   - Trocar TODO por parser de eventos: `order_approved` / `order_refunded` / `subscription_canceled` / `subscription_renewed`.
   - Upsert em `subscriptions_*` com `provider='kiwify'`, `provider_sub_id={event.data.id}` (unique).
   - Tabela `subscription_events_*` keyada por `provider_event_id` (idempotência).
   - Mapear `customer.email` → `auth.users.email` (criar usuário via `createAdminClient()` se não existir).
   - Sincronizar `profiles.plan_id` + `plan_expires_at` via trigger (ou explicitamente).
2. **Hotmart webhook** (`app/api/webhooks/hotmart/route.ts`)
   - **Confirmar antes**: a verificação atual trata `x-hotmart-hottok` como HMAC do body. Hotmart usa **token estático** na maioria das integrações. Provavelmente quebrado em produção.
   - Mesma lógica de parser + idempotência + criação de usuário.
3. **Compartilhar lógica**: criar `lib/billing/webhooks/` com helpers `parseKiwifyEvent()`, `parseHotmartEvent()`, `upsertSubscription()`, `createOrFindUser()`.
4. **PostHog events server-side**: `subscription_started`, `subscription_cancelled`, `subscription_refunded` capturados dentro do webhook, *depois* do commit, com `distinct_id = user.id`.

### Fase 4 — `/admin` shell + listagem de usuários (1 dia)

Estrutura de pastas:

```
app/
└── admin/
    ├── layout.tsx          # requireAdmin() server-side + UI shell
    ├── page.tsx            # Dashboard (Fase 5)
    ├── usuarios/
    │   ├── page.tsx        # Listagem com filtros
    │   └── [id]/
    │       └── page.tsx    # Detalhes + ações de assinatura
    └── assinaturas/
        └── page.tsx        # Lista direta de assinaturas (opcional)
```

**Listagem de usuários** (`/admin/usuarios`):
- Tabela paginada (server-side com cursor): email, nome, plano, status assinatura, último acesso, criado em, ações.
- **Filtros via query params** (`?plan=pro&status=active&active_within=7d`):
  - Plano (free/pro/premium)
  - Status da assinatura (active / past_due / cancelled / trialing / expired)
  - Última atividade (hoje / 7 dias / 30 dias / inativo 30+)
  - Data de cadastro (hoje / 7d / 30d / range custom)
  - Busca por email/nome
- Ordenação por: criação, última atividade, MRR contribuído.
- Bulk actions (v2): exportar CSV, enviar e-mail (depois).
- Botão "Adicionar admin" → modal que muda `profiles.role` (auditado via `admin_actions_*`).

**Sidebar admin** (`components/AdminSidebar.tsx`): renderizado em `app/admin/layout.tsx`, com link "← Voltar ao app". Item "Admin" no sidebar principal só aparece para `isAdmin === true`.

### Fase 5 — Dashboard de métricas (1.5 dias)

`/admin` (raiz). 4 grupos de widgets:

**Grupo 1 — Receita** (Supabase, materialized view `mv_business_metrics`)
- MRR atual (BRL)
- Variação vs. mês passado (%)
- Active subscriptions count
- ARPU
- Refunds do mês (count + valor)
- Próximas expirações (7 dias)

**Grupo 2 — Crescimento** (Supabase)
- Novos signups (hoje / 7d / 30d)
- Conversão signup → primeiro plano pago
- Churn rate (% cancelados / ativos no início do mês)
- Cancelled subscriptions list (últimos 30 dias) com `cancellation_reason`

**Grupo 3 — Engajamento** (PostHog via `posthog-node`)
- DAU (gráfico de linha 30 dias)
- WAU, MAU
- DAU/MAU ratio (stickiness)
- Top 10 páginas mais acessadas
- Top 10 features usadas (do evento `feature_used`)
- Média de sessões por usuário ativo

**Grupo 4 — Saúde do sistema** (Supabase)
- Total de mensagens de chat (mês)
- Total de imagens geradas (mês)
- Total de ebooks gerados (mês)
- Usuários que bateram limite (potenciais upgrades)

**Performance**:
- Widgets do Supabase: `unstable_cache(fetch, ['mv_business_metrics'], { revalidate: 900 })` — 15 min.
- Widgets do PostHog: mesma estratégia. Posthog Query API é lento, evitar chamadas a cada render.
- `mv_business_metrics`: refresh via `pg_cron` a cada 15 min.

### Fase 6 — Gerenciamento de assinatura (1 dia)

Página `/admin/usuarios/[id]`:

**Aba "Assinatura"**:
- Estado atual: plano, status, datas (criada, expira, cancelada), provider, provider_sub_id.
- Histórico de eventos (de `subscription_events_*`).
- Ações (todas auditadas via `admin_actions_*`):
  - **Estender plano** — modal: nova data de expiração + motivo.
  - **Trocar plano manualmente** — modal: novo plano + motivo (não cobra; só ajusta).
  - **Cancelar** — modal: imediato vs. fim do período + motivo + checkbox "registrar refund".
  - **Marcar refund** — valor + motivo (não estorna no provider; só registra).
  - **Conceder gratuitamente** — admin upgrade a free-of-charge premium até data X.

**Aba "Uso"**:
- Contadores do mês atual (`usage_counters_*`).
- Histórico de meses anteriores.

**Aba "Atividade"**:
- Lista de mensagens de chat (count), imagens geradas, ebooks, planos sociais criados.
- Last seen, sessions count (do PostHog).

**Aba "Auditoria"** (só pra esse usuário):
- Lista de `admin_actions_*` onde `target_user_id = $id`.

### Fase 7 — PostHog integração (0.5 dia)

1. `npm i posthog-js posthog-node`
2. Env: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`, `POSTHOG_PERSONAL_API_KEY`.
3. **Client**: `<PostHogProvider>` em um Client Component em volta do `app/layout.tsx` (com `person_profiles: 'identified_only'`).
4. **Server**: factory `getPostHogClient()` em `lib/analytics/posthog.ts` (singleton).
5. **`identify`** logo após login bem-sucedido (passar `user.id` como `distinct_id`, email como property se consentido — ver LGPD na Seção 6).
6. **Server-side `capture`** nos webhooks (subscription_*).
7. **Cookie banner**: pre-consent só roda PostHog em modo `persistence: memory`; após consent, `posthog.opt_in_capturing()`.
8. **Deletion API**: amarrar exclusão de conta com `posthog.capture('$delete_person')` ou Management API.

### Fase 8 — Enforcement de plano (server-side) (0.5 dia)

Trabalho de "limpeza" descoberto na auditoria, que precisa fechar agora ou nunca:

1. **`app/api/chat/route.ts`** — antes de chamar OpenRouter, comparar `lib/openrouter.ts:resolveModel(model).required_plan` com `session.plan.name`. Retornar 402 com `{ upgrade_required: 'pro' }` se incompatível.
2. **`app/api/ebooks/generate/route.ts`** e **`app/api/images/generate/route.ts`** — mesmo gate, considerando modelos premium.
3. **Unificar RPCs**: escolher entre `check_usage_limit` e `check_usage_limit_am`. Migrar callers e dropar a versão antiga.
4. **`app/api/usage/route.ts`** — enriquecer resposta com `quota_total` (vinda do plano), não só `quota_used`. Tirar o TODO da linha 16.
5. **`<UpgradeGate>` component** — mostra modal "Faça upgrade pra Pro" quando o servidor retorna 402.

### Fase 9 — Polimento e ops (0.5 dia)

- Adicionar entrada "Admin" no `components/Sidebar.tsx` (só renderiza se `isAdmin`).
- Testes manuais com um usuário admin e um regular (RLS test critical).
- LGPD: privacy policy mencionando PostHog como subprocessor.
- Documentação interna: como tornar alguém admin via SQL.

---

## 5. Estimativa de Esforço

| Fase | Esforço | Bloqueado por |
|---|---|---|
| 0 — Decisões pendentes (Seção 8) | 1h discussão | Você |
| 1 — Migrations schema | 1 dia | Fase 0 |
| 2 — Auth helpers + admin guard | 0.5 dia | Fase 1 |
| 3 — Webhooks + billing pipeline | 1.5 dias | Fase 1, 2 |
| 4 — `/admin` shell + listagem | 1 dia | Fase 2 |
| 5 — Dashboard de métricas | 1.5 dias | Fase 4 + PostHog instalado |
| 6 — Gerenciamento de assinatura | 1 dia | Fase 3, 4 |
| 7 — PostHog integração | 0.5 dia | Decisão final do tool |
| 8 — Enforcement de plano server-side | 0.5 dia | Fase 1 |
| 9 — Polimento e ops | 0.5 dia | Tudo |
| **Total** | **~7.5 dias** | |

> Em paralelo com o plano de responsividade (`plano-responsividade.md`), dá pra escalonar: fazer Fase 1-3 daqui enquanto a Fase 1-2 de responsividade roda; ambos consomem ~7-8 dias.

---

## 6. Considerações de Segurança / Compliance

### 6.1 RLS é o coração da segurança

- **Nunca use `service_role` no client.** Já está OK hoje (só `createAdminClient()` server-side).
- O admin panel **NÃO deve usar service_role** — usa o cliente do admin logado com as novas policies da migration `014`. Service_role só nos webhooks (onde não há usuário autenticado).
- **Teste o RLS**: criar dois usuários (um admin, um user) e tentar ler/escrever cross-account. Crítico.

### 6.2 Auditoria
- `admin_actions_*` deve registrar TODA ação destrutiva (extend, cancel, refund, change_plan, grant_admin).
- O próprio `admin_actions_*` deve ser **insert-only** (no UPDATE/DELETE policy, nem pra superadmin) — registro à prova de adulteração.

### 6.3 LGPD (PostHog)
- Cloud EU (Frankfurt), DPA assinado.
- Disable IP capture (auto pra EU).
- Não enviar email/CPF/telefone como properties — usar UUID interno.
- Mask inputs sensíveis em session replay (`maskAllInputs` + `maskTextSelector: '[data-private]'`).
- Cookie banner — PostHog em `memory` antes de consent.
- Privacy policy: nomear PostHog como subprocessor.
- Account deletion: cascata pra PostHog via `$delete_person`.

### 6.4 Idempotência de webhooks
- Kiwify reenvia eventos. Hotmart também.
- `subscription_events_*` com `UNIQUE(provider, provider_event_id)` é o que blinda contra duplicatas.

---

## 7. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Hotmart webhook quebrado em prod (signature errada) | Alta | Alto | Validar manualmente o esquema com a doc atual do Hotmart antes de Fase 3 |
| RLS de admin permissivo demais → vazamento de dados | Média | Alto | Code review específico da migration 014 + testes de policy com 2 contas |
| MRR histórico errado após mudança de preço de plano | Alta (se não fizer snapshot) | Médio | Migration 015 obriga `price_brl_snapshot` — fazer antes de qualquer mudança de preço |
| `check_usage_limit` vs `_am` causando bugs em produção | Média | Médio | Unificar na Fase 8 (já faz parte do plano) |
| PostHog free tier estourar inesperadamente | Baixa nos primeiros 6 meses | Baixo | Alerta no console PostHog em 80% do limite |
| Admin remove o próprio acesso de admin sem querer | Média | Médio | Migration 014: bloquear via trigger `BEFORE UPDATE ON profiles WHEN OLD.role = 'admin' AND NEW.role != 'admin'` se for o próprio admin se rebaixando |
| `pg_cron` não disponível no plano Supabase atual | Média | Baixo | Plano: `pg_cron` exige Pro plan no Supabase. Confirmar antes; alternativa: edge function agendada via cron externo |
| Refund manual no admin não estorna no Kiwify/Hotmart | Garantido | Médio | Documentar claramente na UI: "Esta ação apenas registra o reembolso. O estorno deve ser feito no painel do provedor." |

---

## 8. Decisões Tomadas (2026-05-13)

Todas as 9 decisões do design foram fechadas. Ver "Apêndice D — Implicações das Decisões" para detalhes técnicos.

| # | Pergunta | Decisão |
|---|---|---|
| 1 | RBAC depth | **`role` TEXT enum (`user` / `admin` / `superadmin`)** |
| 2 | Plan limits storage | **Manter colunas flat** (`limit_chat_messages`, etc.) |
| 3 | MRR histórico | **`price_brl_snapshot` em `subscriptions`** |
| 4 | `last_active_at` tracking | **Middleware em `proxy.ts` com TTL 5min em memória** |
| 5 | Page views | **PostHog faz tudo** (não criar `page_views_*`) |
| 6 | Cancelamento | **Cancel at period end** (acesso até `expires_at`) |
| 7 | Plano expirado | **Bloqueio total** — usuário não acessa nada, vai pra paywall `/expired` |
| 8 | Admin login | **Mesmo `/login` de todos**, role detectada server-side |
| 9 | MRR refresh strategy | **Event-driven via trigger** (sem `pg_cron`, sem materialized view) |

---

## 9. Critérios de Aceite

A entrega está completa quando:

- [ ] Usuário admin existe e tem RLS permitindo ler todas profiles/subscriptions.
- [ ] Rota `/admin/*` retorna 404 para não-admins (não 403).
- [ ] Sidebar mostra item "Admin" só para `isAdmin === true`.
- [ ] `/admin/usuarios` lista todos os usuários com paginação server-side.
- [ ] Filtros funcionam por: plano, status, última atividade, data de cadastro, busca.
- [ ] `/admin/usuarios/[id]` permite: estender, cancelar, trocar plano, marcar refund — tudo auditado.
- [ ] `/admin` mostra MRR, churn, DAU, top pages, sem erro.
- [ ] Webhook Kiwify cria/atualiza assinaturas reais (verificar com um teste real).
- [ ] Webhook Hotmart funciona com o esquema correto de signature.
- [ ] Tentativa de free user usar modelo `pro` retorna 402 com `upgrade_required`.
- [ ] Plano expirado faz downgrade automático para `free`.
- [ ] PostHog recebe `subscription_started` quando webhook processa compra.
- [ ] Tabela `admin_actions_*` registra cada ação destrutiva.
- [ ] LGPD: privacy policy atualizada, cookie banner em produção, IP capture desligado.
- [ ] Testes manuais com 2 contas (admin + user) confirmam isolamento RLS.

---

## 10. Próximos Passos Imediatos

1. ☐ **Você lê este documento + o de responsividade**
2. ☐ Responder as 9 perguntas da Seção 8 (15 min)
3. ☐ Verificar se `pg_cron` está disponível no seu plano Supabase
4. ☐ Criar conta PostHog Cloud EU (https://eu.posthog.com)
5. ☐ Decidir ordem: começar por admin panel OU responsividade?
6. ☐ Aprovar o roadmap (ou pedir ajustes)
7. ☐ Quando aprovar: começamos pela **Fase 1 (migrations)** — é o gargalo de tudo

---

## Apêndice A — Mapa dos arquivos a tocar

### Novos arquivos
- `supabase/migrations/013_add_admin_role.sql`
- `supabase/migrations/014_admin_rls_policies.sql`
- `supabase/migrations/015_subscription_status_expansion.sql`
- `supabase/migrations/016_user_activity_tracking.sql`
- `supabase/migrations/017_admin_audit_log.sql`
- `supabase/migrations/018_enforce_plan_expiry.sql`
- `supabase/migrations/019_admin_helper_indexes.sql`
- `lib/auth/session.ts`
- `lib/auth/admin.ts`
- `lib/billing/webhooks/kiwify.ts`
- `lib/billing/webhooks/hotmart.ts`
- `lib/billing/subscriptions.ts` (upsert helper)
- `lib/analytics/posthog.ts` (server factory)
- `lib/analytics/events.ts` (taxonomia centralizada)
- `app/admin/layout.tsx`
- `app/admin/page.tsx` (dashboard)
- `app/admin/usuarios/page.tsx` (lista)
- `app/admin/usuarios/[id]/page.tsx` (detalhe)
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/subscription/route.ts`
- `app/api/admin/metrics/route.ts`
- `components/AdminSidebar.tsx`
- `components/admin/UserTable.tsx`
- `components/admin/MetricCard.tsx`
- `components/admin/SubscriptionActions.tsx`
- `components/PostHogProvider.tsx` (client wrapper)
- `components/CookieConsent.tsx`

### Arquivos modificados
- `proxy.ts` — adicionar ADMIN_PREFIXES (ou deixar gating em `app/admin/layout.tsx`)
- `lib/supabase/server.ts` — exportar `getSessionContext`
- `lib/supabase/middleware.ts` — opcionalmente passar admin status
- `app/layout.tsx` — montar PostHogProvider + CookieConsent
- `app/api/webhooks/kiwify/route.ts` — substituir TODO por implementação real
- `app/api/webhooks/hotmart/route.ts` — fix signature + implementação real
- `app/api/auth/register/route.ts` — capturar `user_signed_up` no PostHog
- `app/api/usage/route.ts` — enriquecer com `quota_total`
- `app/api/chat/route.ts` — enforcement `required_plan`
- `app/api/ebooks/generate/route.ts` — idem + unificar RPC
- `app/api/images/generate/route.ts` — idem + unificar RPC
- `lib/openrouter.ts` — exportar `getRequiredPlan(model)` helper
- `components/Sidebar.tsx` — render condicional do item "Admin"
- `components/ExpertCard.tsx` — substituir `isPro` inline por `<PlanBadge>` compartilhado
- `components/PromptCard.tsx` — idem

---

## Apêndice B — Como tornar alguém admin (uma vez tudo pronto)

Após Fase 1 e 2 implementadas, SQL direto no Supabase:

```sql
UPDATE profiles_algoritmo_milionario
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'voce@dominio.com');
```

Re-login e o item "Admin" aparece no sidebar.

Pra criar superadmin (que pode promover/demover outros admins): mesmo SQL com `role = 'superadmin'`.

---

## Apêndice D — Implicações das Decisões Tomadas

### Decisão #7 — Plano expirado bloqueia TUDO (não downgrade pra free)

**O que muda no plano original**:

1. **`/expired` paywall page** — nova rota criada na Fase 4:
   - Renderiza quando `profiles.plan_expires_at < NOW()` e havia plano pago.
   - Mostra: "Sua assinatura expirou em DD/MM/YYYY. Renove pra continuar usando."
   - CTA pro Kiwify/Hotmart com checkout link.
   - Acesso apenas a: `/expired`, `/login`, `/api/auth/logout`. Tudo mais redireciona pra cá.

2. **Mudança em `lib/auth/session.ts`** (Fase 2):
   - `getSessionContext()` retorna campo extra `isExpired: boolean`.
   - `requireAuth()` checa `isExpired` e força redirect pra `/expired`.

3. **Mudança em `proxy.ts`** (Fase 2):
   - Adicionar `EXPIRED_ALLOWED_PREFIXES = ['/expired', '/api/auth/', '/login']`.
   - Se usuário expirado tentar acessar qualquer rota fora dessa lista → 307 redirect pra `/expired`.

4. **Mudança em `check_usage_limit()`** (migration `018`):
   - Antes: lia `plan_id` → comparava limite.
   - Agora: primeiro check `IF v_plan_expires_at IS NOT NULL AND v_plan_expires_at < NOW() THEN RETURN FALSE END IF;`
   - Free users (que nunca tiveram assinatura) continuam com `plan_expires_at = NULL` e passam normalmente.

5. **`subscriptions.status = 'expired'`**:
   - Trigger noturno (ou no próprio `getSessionContext`) seta `status='expired'` quando `expires_at < NOW()`.
   - Sem `pg_cron`: pode ser feito on-read no `getSessionContext` (lazy expiry) — mais simples e instantâneo.

6. **Distinção crítica**:
   - Usuário que nunca pagou → `plan_id = free`, `plan_expires_at = NULL` → **acesso normal** ao plano free.
   - Usuário que pagou e expirou → `plan_id = pro`, `plan_expires_at < NOW()` → **bloqueio total**, vai pra `/expired`.

7. **Risco de churn elevado**:
   - Bloqueio total é mais agressivo. Considerar grace period de 3-7 dias após expiry antes de bloquear (configurável).
   - **Recomendação adicional**: implementar email automático em D-7, D-3, D-0 antes do bloqueio (fora do escopo desse plano, mas anotado).

---

### Decisão #9 — Event-driven MRR refresh (sem `pg_cron`)

**O que muda no plano original**:

1. **Drop da materialized view `mv_business_metrics`** — não é mais necessária.
   - Substituído por **função SQL `compute_business_metrics()`** que retorna MRR/churn/ARPU on-demand.
   - Query é leve (SUM com WHERE status='active'); roda em <50ms até 10k subscriptions.

2. **Cache no Next.js**:
   - Server Component do dashboard chama `compute_business_metrics()` via Supabase RPC.
   - Wrapped com `unstable_cache(fn, ['business-metrics'], { revalidate: 900, tags: ['business-metrics'] })`.
   - TTL de 15 min protege contra refreshes manuais frequentes (admin recarregando a página).

3. **Invalidação event-driven**:
   - Após cada `upsertSubscription()` no webhook (Fase 3): `revalidateTag('business-metrics')`.
   - Após cada ação admin que afeta MRR (cancel, refund, change_plan): `revalidateTag('business-metrics')`.
   - Resultado: dashboard mostra valores frescos em <1s após qualquer evento que mude MRR.

4. **Implementação concreta da função SQL** (migration `020_business_metrics_function.sql`, NOVA):
   ```sql
   CREATE OR REPLACE FUNCTION compute_business_metrics()
   RETURNS TABLE (
     mrr_brl NUMERIC,
     active_subscriptions INT,
     arpu_brl NUMERIC,
     churn_30d NUMERIC,
     refunds_30d_count INT,
     refunds_30d_total_brl NUMERIC
   )
   LANGUAGE plpgsql SECURITY DEFINER AS $$ ... $$;
   ```
   - `SECURITY DEFINER` permite que admin chame mesmo sem RLS direto em `subscriptions`.
   - Adicionar policy: `is_admin(auth.uid())` pra EXECUTE.

5. **Drop da Fase 1 / Migration original `mv_business_metrics`**:
   - O plano original (Fase 5 do roadmap) mencionava `mv_business_metrics`. Substituir pela função `compute_business_metrics()`.
   - Migration `020` substitui o que seria uma MV + refresh policy.

6. **Atualização do roadmap**:
   - Total agora são **8 migrations** (`013` → `020`).
   - Tempo da Fase 1 não muda: 1 dia.
   - Tempo da Fase 5 cai de 1.5 dias → 1 dia (sem necessidade de provisionar pg_cron).

7. **Trade-off perdido vs. ganho**:
   - Perde: histórico automático de MRR em granularidade fina (MV teria snapshots a cada 15min).
   - Ganha: simplicidade, zero ops, MRR sempre atualizado na hora, zero dependência de plano Pro do Supabase.
   - Compensação: se precisar de histórico granular no futuro, adicionar tabela `mrr_snapshots_*` com trigger no webhook (gravar SUM atual em cada evento). Mais simples que MV.

---

## Apêndice C — Bugs descobertos (corrigir junto)

Achados pela auditoria que não são parte direta do admin mas que aparecem no caminho:

1. **`check_usage_limit` vs `check_usage_limit_am`** — drift de migration. Chat usa um, ebooks/images usa outro. Unificar.
2. **`required_plan` cosmético** — agentes/prompts marcados como PRO podem ser usados por free no servidor.
3. **`plan_expires_at` ignorado** — assinatura expirada continua dando acesso pago.
4. **Hotmart webhook signature** — provável erro de implementação (HMAC vs token estático).
5. **`app/api/usage/route.ts:16` TODO** — endpoint não retorna quota total, só o usado.
6. **Profile sem email** — admin precisa join `auth.users` ou view; ou simplesmente adicionar coluna `email` espelhada via trigger.
