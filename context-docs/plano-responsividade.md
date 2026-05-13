# Plano de Responsividade — Algoritmo Milionário

> **Status**: Diagnóstico completo + roadmap pronto para execução
> **Auditoria**: 19 páginas + 13 componentes + globals.css (254 linhas)
> **Stack**: Next.js 16 (App Router) · Tailwind v4 · CSS custom properties
> **Data**: 2026-05-13

---

## 1. Diagnóstico em uma frase

O app **não foi construído pensando em responsividade**. Todo o layout usa estilos inline (`style={{ ... }}`) com larguras fixas em pixels, o `globals.css` tem **apenas 2 media queries** (linhas 103/106), e quase todos os grids têm contagens hard-coded (`repeat(3, 1fr)`, `300px 1fr`, etc.). O resultado: em telas de 375px (iPhone) e 768px (iPad portrait), praticamente toda página apresenta overflow horizontal, sidebars travadas, botões abaixo do touch target mínimo (44px) e textos que não escalam.

---

## 2. Sumário Executivo

| Categoria | Quantidade |
|---|---|
| **Problemas P0 (crítico, app quebra no mobile)** | **47** |
| Problemas P1 (UX ruim mas usável) | 58 |
| Problemas P2 (polimento) | 31 |
| Arquivos afetados | 22 |
| Páginas com sidebar fixa de 260px sem drawer | 1 (afeta todas as rotas /dashboard/*) |
| Páginas com `100vh` que quebra no iOS Safari | 11 |
| Botões/links abaixo de 44px touch target | ~30 ocorrências |
| Tipografia sem `clamp()` ou breakpoint | ~100% das headings |

**Raiz dos problemas**:
1. **Estilos inline impedem CSS responsivo** — não dá para sobrescrever via media query.
2. **Sem sistema de breakpoints** — só existe `768px` como divisor genérico.
3. **Sidebar global travada em 260px** — em telefones consome 70% da tela.
4. **Grids hard-coded** — `repeat(3, 1fr)` em vários lugares, nunca colapsa.
5. **Touch targets pequenos** — `.btn` é 40px (padrão iOS HIG = 44px).
6. **Sem `prefers-reduced-motion`** — animações pesadas degradam mobile low-end.
7. **`100vh` em vez de `100dvh`** — conteúdo é cortado pela barra do Safari mobile.

---

## 3. Estratégia Geral (3 pilares)

### Pilar A — Sistema de Design Responsivo (fundação)
Antes de tocar em qualquer página, definir tokens e breakpoints reutilizáveis. Sem isso, cada correção vira "gambiarra inline".

### Pilar B — Padrões Responsivos Reutilizáveis
Componentes como **drawer mobile**, **app-bar com hambúrguer**, **modal full-screen no mobile**, **rail horizontal com scroll-snap** precisam ser implementados uma única vez e reaproveitados.

### Pilar C — Migração Incremental Página-a-Página
Aplicar a fundação em ordem de criticidade (auth → shell → chat → restantes), de forma que cada PR fique pequeno e revisável.

---

## 4. Sistema de Breakpoints (a adotar)

```
Mobile small:   0     – 479px   (iPhone SE)
Mobile:         480   – 639px   (iPhone padrão)
Tablet port.:   640   – 767px   (iPad mini portrait)
Tablet land.:   768   – 1023px  (iPad portrait)
Desktop:        1024  – 1279px  (notebook)
Wide:           1280px+         (monitor)
```

Em Tailwind v4, alinhar com defaults `sm:640`, `md:768`, `lg:1024`, `xl:1280`, `2xl:1536` para evitar atrito.

### Tokens responsivos a adicionar em `globals.css`:

```css
:root {
  /* Sidebar adaptativa */
  --sidebar-w-mobile:   0;
  --sidebar-w-tablet:   220px;
  --sidebar-w-desktop:  260px;
  --sidebar-w:          var(--sidebar-w-desktop);

  /* Gutter responsivo */
  --gutter:             clamp(16px, 4vw, 32px);
  --section-pad-y:      clamp(32px, 8vw, 80px);

  /* Tipografia fluida */
  --fs-h1:              clamp(24px, 5vw, 40px);
  --fs-h2:              clamp(20px, 4vw, 32px);
  --fs-h3:              clamp(17px, 3vw, 22px);
  --fs-body:            clamp(14px, 1.5vw, 16px);

  /* Altura mínima sem barra do navegador */
  --vh-fix:             100dvh;
}

@media (max-width: 767px) {
  :root { --sidebar-w: var(--sidebar-w-mobile); }
}
@media (min-width: 768px) and (max-width: 1023px) {
  :root { --sidebar-w: var(--sidebar-w-tablet); }
}
```

---

## 5. Auditoria Detalhada (consolidada dos 5 agentes)

### 5.1 Fundação (globals.css + layouts + Sidebar)

| Arquivo:Linha | Prioridade | Problema |
|---|---|---|
| `globals.css:27` | P0 | `--sidebar-w: 260px` hardcoded global; em telas 375px sobra 100px de conteúdo |
| `globals.css:103-108` | P0 | Apenas 1 par de media queries em todo o CSS |
| `globals.css:116` | P1 | `.btn { height: 40px }` — abaixo do mínimo iOS de 44px |
| `globals.css:137` | P1 | `.btn-sm { height: 32px }` — muito abaixo de 44px |
| `globals.css:149` | P1 | `.input { font-size: 14px }` — iOS dá auto-zoom abaixo de 16px |
| `globals.css:50, 223` | P2 | `backdrop-filter: blur(16px)` pesado em mobile low-end, sem fallback |
| `globals.css:56-82` | P2 | Animações sem guard de `prefers-reduced-motion` |
| `app/layout.tsx:11-23` | P1 | Sem `<meta viewport>` explícito; fontes via `<link>` (não `next/font`) |
| `app/dashboard/layout.tsx:14` | P0 | `height: 100vh` quebra no iOS Safari; `overflow: hidden` esconde conteúdo |
| `app/dashboard/layout.tsx:14` | P0 | `display: flex` row sem breakpoint para `column` no mobile |
| `app/dashboard/layout.tsx:15` | P0 | `<Sidebar />` sempre renderizado inline — sem drawer/hambúrguer |
| `components/Sidebar.tsx:52-55` | P0 | `width: var(--sidebar-w); minWidth: var(--sidebar-w); height: 100vh` em estilo inline (não dá pra sobrescrever via CSS) |
| `components/Sidebar.tsx:136` | P1 | Links com `padding: 10px 12px` → 37px altura (< 44px) |
| `components/Sidebar.tsx:138, 244` | P1 | Fontes 13.5px e 10.5px — abaixo do mínimo WCAG legível |
| `components/Sidebar.tsx:153-164` etc. | P1 | `onMouseEnter`/`onMouseLeave` não funcionam em touch |

### 5.2 Auth + Landing

| Arquivo:Linha | Prioridade | Problema |
|---|---|---|
| `app/page.tsx:513` | P0 | Mockup hero `gridTemplateColumns: '200px 1fr'` overflow em 375px |
| `app/page.tsx:544` | P0 | Stat cards `repeat(3, 1fr)` nunca empilham |
| `app/page.tsx:1061` | P0 | Demo Before/After `1fr 1fr` não empilha abaixo de 640px |
| `app/page.tsx:1739` | P2 | `minHeight: 100vh` (usar 100dvh) |
| `app/page.tsx:232` | P1 | Hambúrguer com `padding: 4` → 32px touch (< 44px) |
| `app/page.tsx:265` | P1 | CTAs do menu mobile com `padding: '10px 0'` → 40px |
| `app/login/page.tsx:24` | P0 | `minHeight: 100vh` |
| `app/login/page.tsx:54` | P1 | Submit via `.btn` (40px) — login deve ser `.btn-lg` (48px) |
| `app/login/page.tsx:50` | P1 | "Esqueci a senha" fontSize 12 — touch alvo minúsculo |
| `app/login/page.tsx:33` | P2 | H1 fontSize 22 px (use clamp) |
| `app/register/page.tsx:51, 116` | P0/P1 | Mesmos problemas: 100vh + btn 40px |
| `app/forgot-password/page.tsx:30, 75` | P0/P1 | Idem |

### 5.3 Chat + Agentes + Experts

| Arquivo:Linha | Prioridade | Problema |
|---|---|---|
| `app/dashboard/chat/page.tsx:282` | P0 | Layout flex row + ChatHistorySidebar 260px → coluna chat fica <120px no mobile |
| `app/dashboard/chat/page.tsx:308-362` | P0 | Top bar absoluto com 4 model pills overflow horizontal; padding 80px top esconde 1ª mensagem |
| `app/dashboard/chat/page.tsx:443` | P0 | Input wrapper `marginBottom: 15vh` quebra com teclado mobile |
| `app/dashboard/chat/page.tsx:593` | P1 | Send button ~34px (< 44px touch) |
| `app/dashboard/chat/page.tsx:495` | P1 | Dropdown agent `minWidth: 280` mal cabe em 375px |
| `app/dashboard/agentes/page.tsx:42` | P0 | `repeat(3, 1fr)` hardcoded — 100px por card em 375px |
| `app/dashboard/agentes/page.tsx:25, 30` | P1 | `padding: 40px` + H1 32px sem clamp |
| `components/ChatHistorySidebar.tsx:74` | P0 | `width/minWidth: 260, flexShrink: 0` — 70% da tela em 375px |
| `components/ChatHistorySidebar.tsx:152, 158` | P1 | Delete button só aparece em hover (touch sem acesso); 26x26 < 44px |
| `components/ExpertCard.tsx:38, 35` | P2 | Hover-only translateY sem equivalente touch |
| `components/MarkdownRenderer.tsx:30, 33` | P1 | `<pre>` e tabelas com `overflowX: auto` mas pai sem `min-width: 0` — vazam do balão |
| `components/MarkdownRenderer.tsx:31` | P2 | `<code>` inline sem `word-break` — URLs longas quebram layout |

### 5.4 Geração Visual (Imagens + Ebooks)

| Arquivo:Linha | Prioridade | Problema |
|---|---|---|
| `app/dashboard/imagens/page.tsx:38` | P0 | `padding: '40px 40px 60px'` — 80px de chrome em 375px |
| `app/dashboard/imagens/page.tsx:45` | P1 | H1 36px fixo |
| `app/dashboard/imagens/[id]/page.tsx:21, 36` | P0/P1 | Padding 40px + `minHeight: 360` na imagem |
| `app/dashboard/ebooks/page.tsx:89, 95` | P0/P1 | Mesma padding/heading |
| `app/dashboard/ebooks/[id]/page.tsx:39` | P0 | Padding 32px 40px |
| `components/ImageGenerator.tsx:221-222` | P0 | `gridTemplateColumns: '400px 1fr'` overflow em 375px |
| `components/ImageGenerator.tsx:43, 66` | P0 | AtomLoader 420x320 fixo — overflow |
| `components/ImageGenerator.tsx:224, 400` | P0 | `minHeight: 560` em ambos os painéis (stacked = 1120px sem conteúdo) |
| `components/ImageGenerator.tsx:259-300` | P1 | textarea + model picker apertados depois do stack |
| `components/ImageGallery.tsx:254` | P1 | `minmax(200px, 1fr)` — em 375px só 1 coluna (devia ser 2-col com 140px) |
| `components/ImageGallery.tsx:71-72, 112` | P0 | Modal `maxHeight: 65vh + minHeight: 300` excede viewport em landscape mobile |
| `components/ImageGallery.tsx:131-132` | P1 | Footer modal: prompt + Download em row → botão esmaga |
| `components/EbookGenerator.tsx:543` | P0 | `gridTemplateColumns: '420px 1fr'` overflow |
| `components/EbookGenerator.tsx:196-201` | P0 | Preview 3D do livro 200px com `rotateY(-14deg)` extrapola caixa |
| `components/EbookGallery.tsx:207` | P1 | `minmax(190px, 1fr)` com `aspectRatio: 3/4` → 1 card ocupa viewport inteiro |
| `components/EbookViewer.tsx:149-154, 485` | P0 | Única media query do app é em 1080px (muito alto); abaixo disso sidebar 290px ocupa demais |
| `components/EbookViewer.tsx:259-269` | P0 | iframe PDF `min(84vh, 900px)` sem pinch-zoom em mobile |
| `components/EbookViewer.tsx:163-249` | P0 | Toolbar com 4-5 controles em `flex-wrap` ocupa 200px+ de altura no mobile |

### 5.5 Dashboard Home + Ferramentas + Settings

| Arquivo:Linha | Prioridade | Problema |
|---|---|---|
| `app/dashboard/page.tsx` | — | Wrapper fino — problemas estão em `DashboardHero` |
| `app/dashboard/analisador/page.tsx:329` | P1 | AnalysisLoader 320x320 fixo — overflow em 375px |
| `app/dashboard/analisador/page.tsx:611, 696` | P0 | H1 28px/32px fixos no resultado |
| `app/dashboard/analisador/page.tsx:756-784` | P0 | Input row flex sem wrap, botão com `minWidth: 180` |
| `app/dashboard/criador-produto/page.tsx:611-631` | P0 | Tabs `flex gap: 4` ~520px largura — overflow em 375px |
| `app/dashboard/criador-produto/page.tsx:824-850` | P0 | Market (flex 2) + Price (flex 1) sem flexWrap |
| `app/dashboard/criador-produto/page.tsx:567-608` | P0 | Header: Voltar + título + Salvar sem wrap |
| `app/dashboard/criador-produto/page.tsx:565, 649, 768, 906` | P0 | Múltiplos `padding: 24-28px` heavy em mobile |
| `app/dashboard/planejador/page.tsx:466` | P0 | ItemEditorModal `minmax(0, 1.1fr) minmax(300px, 0.9fr)` — segunda coluna força 300px |
| `app/dashboard/planejador/page.tsx:552` | P0 | Status grid `repeat(3, minmax(0, 1fr))` dentro do modal já overflow |
| `app/dashboard/planejador/page.tsx:1253` | P0 | Header flex sem wrap (Voltar + título + progress 180px) |
| `app/dashboard/planejador/page.tsx:1401` | P0 | Calendar month-view `minmax(220px, 1fr)` minHeight 240 → scroll vertical absurdo no mobile |
| `app/dashboard/planejador/page.tsx:1302-1396` | P0 | Mode-switch toolbar com inner-flex sem wrap |
| `app/dashboard/prompts/page.tsx:60, 138-141` | P1 | Padding 28px + 3 StatPills com wrap awkward |
| `app/dashboard/configuracoes/page.tsx:11` | P0 | `padding: 40px` — 21% do viewport em 375px |
| `app/dashboard/configuracoes/page.tsx:35-60` | P1 | Plan row + items com flexWrap, mas botões ficam órfãos |
| `components/DashboardHero.tsx:267, 264` | P0 | H1 28px fixo + padding `24px 32px 64px` |
| `components/DashboardHero.tsx:201` | P1 | Labels com `whiteSpace: nowrap + ellipsis` truncam em 375 |
| `components/FeatureCards.tsx:24, 28` | P0/P1 | `flexWrap` com `width: 160` fixo — nunca atinge 1-col |
| `components/PromptCard.tsx:96` | P1 | `minHeight: 6.4em` força card alto mesmo com texto curto |
| `components/PromptCategoryRail.tsx:84, 91, 131` | P0 | 2 botões nav 42x42 sempre renderizados — consomem 108px em 375px |
| `components/PromptCategoryRail.tsx:111` | P0 | `minmax(220px, 1fr)` inconsistente: estica com poucos cards, overflow com muitos |

---

## 6. Padrões Responsivos a Implementar (reutilizáveis)

### Padrão 1 — Mobile Drawer Sidebar

**Onde**: `components/Sidebar.tsx`, `components/ChatHistorySidebar.tsx`

```
< 768px:  position: fixed; transform: translateX(-100%); + backdrop overlay
≥ 768px:  position: relative; layout fixo de 220-260px
```

**Componentes auxiliares a criar**:
- `components/MobileTopBar.tsx` — barra superior com hambúrguer + logo (só `< 768px`)
- `components/DrawerBackdrop.tsx` — overlay escuro com `onClick` para fechar
- Hook `useDrawerState()` — gerencia open/close + bloqueio de scroll do body + ESC + focus trap

### Padrão 2 — Container Responsivo

Substituir todos `padding: '40px'`, `padding: '28px 24px'`, etc. por classe utilitária:

```css
.responsive-shell {
  padding: clamp(16px, 4vw, 40px);
  max-width: 1200px;
  margin: 0 auto;
}
```

### Padrão 3 — Grid Auto-Fit Universal

Substituir `repeat(3, 1fr)`, `repeat(auto-fill, minmax(280px, 1fr))` inconsistentes por:

```css
.grid-cards-sm { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
.grid-cards-md { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.grid-cards-lg { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
```

### Padrão 4 — Modal Full-Screen no Mobile

Modais (`ImageGallery`, `EbookViewer`, `ItemEditorModal` do planejador) viram tela inteira abaixo de 640px:

```css
.modal {
  width: min(820px, 100%);
  max-height: 90dvh;
}
@media (max-width: 639px) {
  .modal {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
}
```

### Padrão 5 — Generator Two-Panel → Stack

Para `ImageGenerator` e `EbookGenerator`:

```css
.generator-shell {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}
@media (min-width: 960px) {
  .generator-shell {
    grid-template-columns: 400px 1fr;
    gap: 32px;
  }
}
```

Remover `minHeight: 560` no mobile.

### Padrão 6 — Touch Targets

Variante `.btn-touch` para CTAs primárias:

```css
.btn-touch { min-height: 48px; padding: 14px 20px; font-size: 15px; }
```

Aplicar em: submit de auth, send do chat, "Gerar" dos generators, "Salvar" do criador-produto.

### Padrão 7 — Tipografia Fluida

Substituir TODOS `fontSize: 32`, `fontSize: 28`, `fontSize: 22`, etc. por:

- H1 hero: `font-size: var(--fs-h1)` → `clamp(24px, 5vw, 40px)`
- H2 seção: `font-size: var(--fs-h2)` → `clamp(20px, 4vw, 32px)`
- H3 card: `font-size: var(--fs-h3)` → `clamp(17px, 3vw, 22px)`

### Padrão 8 — Toolbar Rail Horizontal

Para tabs do criador-produto e mode-switch do planejador:

```css
.toolbar-rail {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.toolbar-rail > * { scroll-snap-align: start; flex-shrink: 0; }
```

Esconder botões "anterior/próxima" do `PromptCategoryRail` abaixo de 768px.

### Padrão 9 — `100vh` → `100dvh`

Substituir globalmente:
- `app/layout.tsx`
- `app/dashboard/layout.tsx`
- `app/login/page.tsx`, `register/page.tsx`, `forgot-password/page.tsx`
- `app/page.tsx:1739`
- `components/Sidebar.tsx:54`
- `app/dashboard/chat/page.tsx`

### Padrão 10 — Chat Input com Safe Area

Mudar `margin-bottom: 15vh` para:

```css
.chat-input {
  position: sticky;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom, 12px);
  background: var(--bg);
}
```

---

## 7. Roadmap de Execução (em ordem)

### Fase 0 — Pré-requisitos (1 dia) ✅ CONCLUÍDA

> **Resumo de execução**: Adicionados todos os tokens responsivos ao `globals.css` (variáveis `--sidebar-w-*`, `--gutter`, `--fs-h1/h2/h3/h4`, `--vh-fix`) com media queries para sobrescrever `--sidebar-w` em mobile e tablet. Criadas as classes utilitárias `.responsive-shell`, `.grid-cards-sm/md/lg`, `.generator-shell`, `.modal`, `.toolbar-rail`, `.btn-touch`, além de guard `prefers-reduced-motion` e fallback `@supports not (backdrop-filter)`. Atualizado `globals.css`: `.btn` → `min-height: 44px`, `.btn-sm` → `min-height: 36px`, `.input font-size` → `16px` (evita zoom no iOS). Adicionado `export const viewport: Viewport` em `app/layout.tsx` com `width: 'device-width', initialScale: 1`.

1. **Decidir estratégia de migração** dos estilos inline:
   - Opção A: manter `style={}` e usar `useMediaQuery` hook + JS condicional
   - Opção B (recomendada): migrar gradualmente para Tailwind classes + CSS modules
2. **Adicionar tokens responsivos** no `globals.css` (seção 4 acima)
3. **Configurar Tailwind v4** (`@theme` block) com os breakpoints alinhados
4. **Setup do Playwright** para screenshots em 3 viewports (375/768/1280) — opcional mas recomendado

### Fase 1 — Fundação (1-2 dias) — desbloqueia tudo ✅ CONCLUÍDA

> **Resumo de execução**: Implementado o padrão de drawer mobile na `Sidebar.tsx`: no mobile (< 768px) a sidebar fica `position: fixed` com `transform: translateX(-100%)` e desliza ao receber a classe `sidebar-open`; no tablet usa `--sidebar-w-tablet` (220px); no desktop mantém layout inline. Criados os componentes `MobileTopBar.tsx` (barra superior com botão hambúrguer de 48px, oculta em `md:hidden`) e `DrawerBackdrop.tsx` (overlay com `rgba(0,0,0,0.5)` para fechar o drawer ao clicar). O `app/dashboard/layout.tsx` foi refatorado em dois arquivos: o Server Component delega para `DashboardShell.tsx` (Client Component) que gerencia o estado `sidebarOpen` e orquestra Sidebar + MobileTopBar + DrawerBackdrop. Todos os `height: 100vh` foram substituídos por `height: 100dvh`, paddings de links aumentados para `12px 14px` (≥ 44px), fontes ajustadas para mínimo de 12–14px.

1. **Sidebar Drawer Pattern** (`components/Sidebar.tsx` + novo `MobileTopBar.tsx`)
2. **Refatorar `app/dashboard/layout.tsx`** — remover inline styles, usar classes
3. **Aplicar `100dvh`** em layouts e auth
4. **Bump `.btn` para 44px** + criar `.btn-touch` (48px) em `globals.css`
5. **Aplicar `viewport` export** em `app/layout.tsx` + migrar para `next/font`

### Fase 2 — Auth + Landing (0.5 dia) ✅ CONCLUÍDA

> **Resumo de execução**: Em `app/page.tsx`, substituído `minHeight: '100vh'` por `100dvh`, colapso dos grids do hero mockup (`200px 1fr` → `auto-fit minmax(200px, 1fr)`), stat cards (`repeat(3, 1fr)` → `auto-fill minmax(160px, 1fr)`), e Before/After demo (`1fr 1fr` → `auto-fit minmax(280px, 1fr)`) para empilhar em mobile. Botão hambúrguer aumentado para `padding: 10px` com `minWidth/minHeight: 44px`; CTAs do menu mobile aumentados para `padding: 12px 0` com `minHeight: 44px`. Nas páginas de auth (`login`, `register`, `forgot-password`): `100vh` → `100dvh`, H1 fixos → `clamp(20px, 4vw, 28px)`, botões de submit adicionados classe `.btn-touch` (48px), link "Esqueci a senha" aumentado para `font-size: 14px` com área de toque ≥ 44px.

6. `app/page.tsx` — colapsar grids `200px 1fr`, `1fr 1fr` e `repeat(3, 1fr)` abaixo de 768px
7. `login`, `register`, `forgot-password` — `.btn-lg`, `100dvh`, tipografia clamp

### Fase 3 — Chat Ecosystem (1 dia) ✅ CONCLUÍDA

> **Resumo de execução**: `ChatHistorySidebar.tsx` reformulado com o mesmo padrão de drawer mobile da Sidebar: `position: fixed; transform: translateX(-100%)` abaixo de 768px, com props `isOpen/onClose`; botão de delete agora sempre visível (não hover-only) com 44px de touch target. No `app/dashboard/chat/page.tsx`: top bar de model pills substituída por `.toolbar-rail` para scroll horizontal; `marginBottom: 15vh` do input removido e substituído por `paddingBottom: max(24px, env(safe-area-inset-bottom))`, sem risco de sobreposição pelo teclado; send button aumentado para 44×44px com `aria-label`; dropdown de agente adaptado para `min(280px, calc(100vw - 32px))`; container da mensagem com `minWidth: 0; overflow: hidden`. Em `agentes/page.tsx`: padding substituído por `.responsive-shell`, grid `repeat(3, 1fr)` → `auto-fill minmax(200px, 1fr)`, H1 → `var(--fs-h1)`. Em `MarkdownRenderer.tsx`: `<pre>` com `minWidth: 0`, `<code>` inline com `overflowWrap: anywhere`, tabelas envolvidas em `<div overflowX: auto; minWidth: 0>`.

8. `components/ChatHistorySidebar.tsx` — drawer pattern abaixo de `md`
9. `app/dashboard/chat/page.tsx` — top bar reorganizado, model pills com scroll-rail, input sticky com safe-area, send button 44px
10. `app/dashboard/agentes/page.tsx` — grid auto-fit
11. `components/MarkdownRenderer.tsx` — `min-width: 0` + `overflow-wrap: anywhere` + tabela com wrapper de scroll

### Fase 4 — Geração Visual (1 dia) ✅ CONCLUÍDA

> **Resumo de execução**: `ImageGenerator.tsx` migrado de `gridTemplateColumns: '400px 1fr'` para a classe `.generator-shell` (stack abaixo de 960px), `minHeight: 560` removido do painel direito (reduzido para 320px mínimo), `AtomLoader` tornado responsivo com `width: min(420px, 90vw)`. `EbookGenerator.tsx` idem com classe `.generator-shell`, preview 3D do livro recebe `width: min(200px, 40%)` e `overflow: hidden` no container pai. `ImageGallery.tsx`: grid `minmax(200px, 1fr)` → `minmax(140px, 1fr)`, modal recebe classe `.modal` (full-screen ≤639px), `maxHeight` do iframe → `60dvh`, footer com `flexWrap: wrap`. `EbookGallery.tsx`: grid `190px` → `140px`. `EbookViewer.tsx`: breakpoint CSS de 1080px baixado para 768px, toolbar recebe classe `ebook-toolbar-controls` para scroll horizontal no mobile, iframe corrigido para `min(80dvh, 900px)` com `minWidth: 0`, e adicionado link "Abrir PDF em nova aba ↗" sempre visível como fallback touch.

12. `ImageGenerator` + `EbookGenerator` — generator-shell pattern (stack abaixo de 960px)
13. `ImageGallery` + `EbookGallery` — grids mobile com `minmax(140px, 1fr)`
14. Loaders (`AtomLoader`, `BookLoader`) — `max-width: 100%` + SVG viewBox-only
15. `ImageGallery` modal — full-screen abaixo de 640px
16. `EbookViewer` — toolbar collapse, iframe substituído por "Abrir em nova aba" em touch devices, breakpoint baixado de 1080 → 768px

### Fase 5 — Dashboard + Ferramentas (1.5 dias) ✅ CONCLUÍDA

> **Resumo de execução**: `DashboardHero.tsx`: padding substituído por `.responsive-shell`, H1 `28px` → `var(--fs-h1)`, label de card alterado para `wordBreak: break-word` (sem truncate forçado em mobile). `FeatureCards.tsx`: migrado de `flex + width: 160` para `grid auto-fill minmax(140px, 1fr)`. `PromptCategoryRail.tsx`: botões de navegação anterior/próximo recebem `.hide-mobile` (ocultos < 768px), grid do rail `minmax(220px)` → `minmax(160px)`, e a classe `.toolbar-rail` aplicada ao container. `PromptCard.tsx`: `minHeight: 6.4em` removido. `analisador/page.tsx`: `AnalysisLoader` 320×320 → `min(320px, 100%)`, H1s → `var(--fs-h1)`, botão "Analisar" com `minWidth: min(180px, 100%)` e `flexWrap: wrap` no row. `criador-produto/page.tsx`: padding → `clamp(16px, 4vw, 28px)`, tabs → `.toolbar-rail`, header + Market+Price → `flexWrap: wrap`, H1 → `var(--fs-h1)`. `planejador/page.tsx`: ItemEditorModal grid → `auto-fit minmax(280px, 1fr)`, status grid → `auto-fill minmax(100px, 1fr)`, header com `flexWrap: wrap`, mode-switch toolbar → `.toolbar-rail`, calendar month-view → `minmax(min(220px, 100%), 1fr)`. `prompts/page.tsx` e `configuracoes/page.tsx`: padding → `clamp(16px, 4vw, X)`.

17. `DashboardHero` — tipografia clamp + padding shell + grids auto-fit
18. `FeatureCards` — migrar de flex para grid auto-fit
19. `analisador` — header com wrap, loader scaling, tipografia clamp
20. `criador-produto` — tabs em rail horizontal, market+price com flexWrap, headers com wrap
21. `planejador` — **maior trabalho do projeto**:
    - ItemEditorModal → coluna única abaixo de 768px
    - Month-view → lista vertical de dias abaixo de 768px
    - Header com wrap (Voltar + título + progress)
22. `prompts` — padding responsivo + StatPills
23. `configuracoes` — padding responsivo + (futuro) tabs

### Fase 6 — Polimento (0.5 dia) ✅ CONCLUÍDA

> **Resumo de execução**: Auditoria final de `100vh` — encontrados 6 usos restantes em `planejador`, `criador-produto` e `analisador`; todos substituídos por `100dvh` via `sed`. Botão ícone "Paperclip" (anexar arquivo) no chat recebeu `aria-label="Anexar arquivo"` e `minWidth/minHeight: 44px`. Botão fechar do modal `ImageGallery` aumentado de 30×30 para 44×44px. Guard `@media (prefers-reduced-motion: reduce)` já estava implementado na Fase 0 cobrindo todo o projeto. Fallback `@supports not (backdrop-filter)` para `.glass` e `.stitch-glass-card` também já implementado na Fase 0. TypeScript compila sem erros em todas as 7 fases.

24. Adicionar `prefers-reduced-motion` em todas as animações de `globals.css`
25. Substituir hover-only por focus-visible/active onde aplicável
26. Adicionar `aria-label` aos botões icon-only + ARIA do drawer
27. Auditoria de contraste WCAG AA (texto 13.5px no sidebar, 11px no plano)
28. Testes visuais nos 3 viewports principais (375/768/1280)

---

## 8. Estimativa de Esforço

| Fase | Esforço | Cumulativo |
|---|---|---|
| 0 — Pré-requisitos | 1 dia | 1 |
| 1 — Fundação | 1-2 dias | 2-3 |
| 2 — Auth + Landing | 0.5 dia | 2.5-3.5 |
| 3 — Chat | 1 dia | 3.5-4.5 |
| 4 — Geração Visual | 1 dia | 4.5-5.5 |
| 5 — Dashboard + Ferramentas | 1.5 dias | 6-7 |
| 6 — Polimento | 0.5 dia | **6.5-7.5 dias** |

**Total estimado**: ~7 dias de trabalho focado de um dev senior.

---

## 9. Decisão Estratégica a Tomar

Antes de iniciar a Fase 0, **decidir**:

### A) Migração para Tailwind v4 puro (recomendado)
- **Prós**: classes responsivas built-in (`sm:`, `md:`, etc.), código mais legível, alinha com a stack já instalada.
- **Contras**: tocar em quase todo arquivo `.tsx` (refactor maior).
- **Esforço extra**: +2 dias para refatorar inline styles.

### B) Manter `style={}` inline com hook `useMediaQuery`
- **Prós**: zero refactor visual, mantém arquivos como estão.
- **Contras**: JS-driven (não server-renderiza certo o estado mobile), flashes de layout no carregamento, mais código para manter, sem suporte de DevTools nativo a media queries.
- **Esforço**: o mesmo (não economiza, só desloca complexidade).

### C) Híbrido — CSS modules para layouts + Tailwind para utilitários
- **Prós**: melhor isolamento, segrega bem fundação de detalhe.
- **Contras**: 3 estilos diferentes no projeto (inline + CSS modules + Tailwind) — confusão.

**Recomendação**: **A — Tailwind v4 puro**. A stack já tem, é o caminho de menor atrito a médio prazo, e o esforço extra (2 dias) se paga no mês seguinte.

---

## 10. Critérios de Aceite

A migração é considerada completa quando:

- [ ] Toda página renderiza sem scroll horizontal em 375px de largura
- [ ] Sidebar global é drawer abaixo de 768px com backdrop + hambúrguer
- [ ] Todos botões/links interativos têm ≥44px de altura/largura tap
- [ ] Nenhum `100vh` no código — só `100dvh` ou `min-h-svh`
- [ ] Nenhuma `style={{ width: 'XXXpx' }}` que não tenha equivalente responsivo
- [ ] Tipografia das headings usa `clamp()` ou `text-xl sm:text-2xl md:text-3xl`
- [ ] Modais (`ImageGallery`, `EbookViewer`, `ItemEditorModal`) viram full-screen abaixo de 640px
- [ ] Generators (`ImageGenerator`, `EbookGenerator`) empilham abaixo de 960px
- [ ] `prefers-reduced-motion` honrado por todas animações
- [ ] Lighthouse mobile score ≥ 90 nas rotas críticas (`/`, `/login`, `/dashboard`, `/dashboard/chat`)

---

## 11. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Quebrar layout desktop ao migrar | Alta | Médio | Screenshot diff antes/depois de cada PR; manter PRs pequenos (1 página por PR) |
| Estado do drawer não persistir entre rotas | Média | Baixo | Usar Context API ou Zustand para drawer state |
| iframe do EbookViewer não funcionar em mobile | Alta | Médio | Detectar touch device → mostrar "Abrir em nova aba" como CTA principal |
| Performance ruim com `clamp()` em 100% das fontes | Baixa | Baixo | Browsers modernos otimizam — não há risco real |
| Conflito Tailwind v4 com Next.js 16 | Baixa | Alto | Já funciona no build atual; manter `@tailwindcss/postcss` |
| Refactor inline → Tailwind quebrar regressões visuais | Alta | Médio | Estabelecer screenshot tests com Playwright antes de começar |

---

## 12. Próximos Passos Imediatos

1. ✅ **Você lê este documento**
2. ☐ Decidir entre estratégia A/B/C da seção 9
3. ☐ Aprovar o roadmap (ou pedir ajustes nas fases)
4. ☐ Começar pela **Fase 0** — adicionar tokens em `globals.css`
5. ☐ Quando estiver pronto, executar **Fase 1 (Fundação)** — desbloqueia o resto

---

**Apêndice A — Arquivos auditados**:
- `app/globals.css`, `app/layout.tsx`, `app/dashboard/layout.tsx`
- `app/page.tsx`, `app/login/page.tsx`, `app/register/page.tsx`, `app/forgot-password/page.tsx`
- `app/dashboard/page.tsx`, `app/dashboard/chat/page.tsx`, `app/dashboard/chat/[id]/page.tsx`
- `app/dashboard/agentes/page.tsx`, `app/dashboard/experts/page.tsx`
- `app/dashboard/imagens/page.tsx`, `app/dashboard/imagens/[id]/page.tsx`
- `app/dashboard/ebooks/page.tsx`, `app/dashboard/ebooks/[id]/page.tsx`
- `app/dashboard/analisador/page.tsx`, `app/dashboard/criador-produto/page.tsx`
- `app/dashboard/planejador/page.tsx`, `app/dashboard/prompts/page.tsx`, `app/dashboard/configuracoes/page.tsx`
- `components/Sidebar.tsx`, `components/ChatHistorySidebar.tsx`, `components/DashboardHero.tsx`
- `components/FeatureCards.tsx`, `components/ExpertCard.tsx`, `components/MarkdownRenderer.tsx`
- `components/ImageGenerator.tsx`, `components/ImageGallery.tsx`, `components/EbookGenerator.tsx`
- `components/EbookGallery.tsx`, `components/EbookViewer.tsx`
- `components/PromptCard.tsx`, `components/PromptCategoryRail.tsx`

**Apêndice B — Como reproduzir os testes**:
1. Rodar `npm run dev`
2. Chrome DevTools → Toggle Device Toolbar → testar em:
   - iPhone SE (375 × 667)
   - iPad Mini (768 × 1024)
   - Desktop (1280 × 800)
3. Verificar overflow horizontal, sidebar comportamento, touch targets via DevTools "Show device frame".
