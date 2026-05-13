# Algoritmo Milionário — App Brief

## What Is It?

**Algoritmo Milionário** is a Brazilian AI SaaS platform built specifically for infoproduct creators and digital marketers. It provides a centralized hub of AI-powered tools — chat, image generation, ebook creation, social media planning, product structuring, and offer analysis — all tuned to the Brazilian digital marketing market and its proven frameworks.

**Tagline:** "Hub de IA para Infoprodutores"
**Full Description:** "A plataforma de inteligência artificial para criação de infoprodutos, copywriting e marketing digital."
**Language:** Portuguese (pt-BR)
**Market:** Brazilian infoprodutores, content creators, digital marketers

---

## Target Audience

- Infoprodutores (creators of digital courses, ebooks, mentorships)
- Digital marketers running paid ads and funnels
- Copywriters writing VSLs, TSLs, emails, and social content
- Social media managers planning and producing content at scale
- Anyone building and selling knowledge products in Brazil

---

## Core Features (8 Tools)

### 1. Chat Multi-Modelo
Multi-model AI chat in a single interface. Users can switch between models mid-conversation without losing context.

**Supported models:**
- GPT-4o (OpenAI)
- Claude Sonnet 4.5 (Anthropic)
- Gemini 2.5 Pro (Google)
- DeepSeek V3
- Million AI 1.0 (proprietary)

**Capabilities:** Streaming responses, conversation history with pin/delete, specialized system prompts per agent, markdown rendering.

---

### 2. Agentes Experts
Pre-built AI agents trained on Brazilian digital marketing, copywriting, and sales. Each agent has a curated system prompt that shapes its expertise.

**Agent categories:** copywriting, ads, email, reels, sales, general strategy.

---

### 3. Gerador de Imagens
AI image generation for social media assets, ebook covers, and ad creatives. Images are stored in Backblaze B2. Supports multiple generation models (DALL-E 3, Flux-1, etc.).

---

### 4. Criador de Ebooks
Generates complete ebooks with chapters, table of contents, and professional formatting. Users define title, theme, tone, and target audience. Uses the Gamma API for PDF generation. Tracks status in real-time (pending → generating → done / error).

---

### 5. Planejador Social
Creates 15 or 30-day social media content plans. Based on Gary Vaynerchuk and Érico Rocha methodologies.

**Each plan includes:**
- 3 Stories per day (intimacy/social proof)
- Reels (reach/authority)
- Feed posts (value delivery)
- Carousels (education/engagement)
- Full hooks, CTAs, and strategy context per post

Users can view by calendar, edit individual posts, and export the plan.

---

### 6. Criador de Produto
Structures complete digital products (courses, mentorships, memberships) using proven sales frameworks.

**Frameworks used:**
- Alex Hormozi's $100M Offers (value equation, value stacking, risk reversal)
- Stefan Georgi's RMBC (Root Mechanism, Believability, Connection)

**Output includes:**
- Product name and 4 conversion headlines
- Unique mechanism definition
- VSL and TSL structure
- Order bump, upsell, and downsell offers
- Full funnel strategy

---

### 7. Analisador de Oferta
Analyzes sales pages and copy with surgical precision. Scores across 8 dimensions and provides actionable improvement suggestions.

**Scoring dimensions (1–10 each):**
1. Hook strength
2. Clarity of problem
3. Unique mechanism
4. Value stack
5. Social proof
6. Guarantee strength
7. CTA effectiveness
8. Urgency / scarcity

Also identifies which copywriting frameworks are present, what's missing, and provides prioritized modeling suggestions.

---

### 8. Biblioteca de Prompts
A curated library of hundreds of ready-to-use, expert-optimized prompts organized by category.

**Categories:** copywriting, ads, email, reels, sales, strategy.

Each prompt includes model recommendations and is access-controlled by plan.

---

## Supporting Features

- **User Authentication** — Email/password via Supabase Auth
- **Conversation History** — Saved chats with pin, rename, delete
- **Usage Tracking** — Monthly limits enforced per plan per feature
- **Settings & Profile** — Manage name, email, avatar, plan info
- **RLS (Row Level Security)** — All DB tables locked to authenticated user

---

## Business Model

### Pricing Tiers

| Plan | Price | Chat | Images | Ebooks | Models |
|---|---|---|---|---|---|
| Gratuito | R$ 0 | 30 msgs/mo | 5/mo | 1/mo | Basic |
| Pro | R$ 97/mo | 500 msgs/mo | 50/mo | 10/mo | GPT-4, Claude, Gemini |
| Premium | R$ 197/mo | Unlimited | Unlimited | Unlimited | All + Claude Opus, o3 |

### Payment Providers
- **Kiwify** — Primary Brazilian checkout provider
- **Hotmart** — Secondary Brazilian checkout provider
- Webhook-based subscription lifecycle: purchase → activate → cancel/expire

### Subscription Flow
1. User clicks upgrade → redirected to Kiwify/Hotmart checkout
2. Provider webhook hits `/api/webhooks/{provider}`
3. HMAC signature verified
4. Subscription created/updated in DB
5. User's `plan_id` updated in profile
6. New limits apply immediately on next request

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password) |
| AI Gateway | OpenRouter (unified LLM API) |
| Primary Model | Gemini 2.5 Flash (via OpenRouter) |
| Image Storage | Backblaze B2 (via AWS S3 SDK) |
| Ebook Generation | Gamma API |
| Validation | Zod |
| Rate Limiting | Upstash Redis (infrastructure ready) |
| Markdown | react-markdown + remark-gfm |
| Deployment | Vercel |

---

## Database Schema (10 Core Tables)

| Table | Purpose |
|---|---|
| `plans_algoritmo_milionario` | Pricing tiers, feature flags, model access |
| `profiles_algoritmo_milionario` | User extensions (name, avatar, plan_id) |
| `usage_counters_algoritmo_milionario` | Monthly usage tracking per user per feature |
| `conversations_algoritmo_milionario` | Chat conversation metadata (title, model, pin) |
| `messages_algoritmo_milionario` | Individual messages with token counts |
| `agents_algoritmo_milionario` | Agent library with system prompts and categories |
| `generated_images_algoritmo_milionario` | User image gallery (prompt, URL, model) |
| `generated_ebooks_algoritmo_milionario` | User ebook gallery (status, PDF URL) |
| `prompts_algoritmo_milionario` | Curated prompt library |
| `subscriptions_algoritmo_milionario` | Subscription and payment history |

All tables have RLS enabled. Admin operations use service_role functions.

---

## Routes

### Public
| Route | Purpose |
|---|---|
| `/` | Landing page (hero, features, testimonials, pricing) |
| `/login` | Login form |
| `/register` | Account creation |
| `/forgot-password` | Password recovery |

### Dashboard (Authenticated)
| Route | Purpose |
|---|---|
| `/dashboard` | Main hub with feature cards |
| `/dashboard/chat` | Multi-model chat |
| `/dashboard/agentes` | Browse and select agents |
| `/dashboard/planejador` | Social media planner |
| `/dashboard/criador-produto` | Product creator |
| `/dashboard/analisador` | Offer analyzer |
| `/dashboard/imagens` | Image gallery + generator |
| `/dashboard/ebooks` | Ebook gallery + generator |
| `/dashboard/prompts` | Prompt library |
| `/dashboard/configuracoes` | Account settings |

### API Routes
| Route | Purpose |
|---|---|
| `/api/chat` | Streaming chat (OpenRouter) |
| `/api/conversations` | Chat history CRUD |
| `/api/products` | Product generation |
| `/api/ebooks/generate` | Trigger ebook generation |
| `/api/images/generate` | Trigger image generation |
| `/api/images/gallery` | User image gallery |
| `/api/social-planner` | Plan generation and retrieval |
| `/api/offer-analysis` | Offer scoring and analysis |
| `/api/usage` | Check current usage limits |
| `/api/auth/register` | User registration |
| `/api/webhooks/kiwify` | Kiwify payment webhook |
| `/api/webhooks/hotmart` | Hotmart payment webhook |

---

## Methodologies Embedded in the Product

The AI prompts are built around three proven frameworks, making them teachable and repeatable:

1. **Alex Hormozi — $100M Offers**
   - Value equation (dream outcome × likelihood ÷ time × effort)
   - Value stacking with order bumps, upsells, downsells
   - Risk reversal via guarantees

2. **Stefan Georgi — RMBC Method**
   - Root mechanism identification
   - Problem mechanism → Solution mechanism copywriting
   - VSL and TSL (Video & Text Sales Letter) structures

3. **Gary Vaynerchuk — Content Strategy**
   - "Document, don't create" philosophy
   - Jabs (value) vs right hooks (CTA)
   - Daily volume + consistency
   - Stories for intimacy, Reels for reach, Feed for authority

---

## Environment Variables

| Variable | Purpose | Exposure |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase read-only key | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB access | Server only |
| `OPENROUTER_API_KEY` | AI model gateway | Server only |
| `KIWIFY_WEBHOOK_SECRET` | Webhook HMAC validation | Server only |
| `HOTMART_WEBHOOK_SECRET` | Webhook HMAC validation | Server only |
| `B2_ENDPOINT` | Backblaze S3-compat URL | Server only |
| `B2_KEY_ID` | Backblaze key ID | Server only |
| `B2_APPLICATION_KEY` | Backblaze secret key | Server only |
| `GAMMA_API_KEY` | Ebook/PDF generation | Server only |
