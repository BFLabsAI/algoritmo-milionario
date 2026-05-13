# Change Log — Algoritmo Milionário

---

## Instruções de Preenchimento

Cada entrada do change log deve seguir o formato abaixo. **Nunca agrupe mudanças não relacionadas num mesmo bloco.**

```
---
### [YYYY-MM-DD HH:MM] — Título da Mudança

**Descrição:**
Explique o que foi feito, por que foi feito e qual o impacto esperado.

**Arquivos alterados:**
- `caminho/do/arquivo.tsx` — o que mudou nele
```

**Regras:**
- Um bloco por mudança, mesmo que seja no mesmo dia e horário
- Data e hora no formato `YYYY-MM-DD HH:MM`
- Título curto e descritivo (máximo ~60 caracteres)
- Descreva o **porquê**, não apenas o **o quê**
- Liste todos os arquivos tocados, com uma nota do que mudou em cada um

---

## Registro de Mudanças

---

### [2026-05-13 10:00] — Reorganização das Skills para pasta local do projeto

**Descrição:**
As skills que estavam na pasta raiz `skills/` do projeto foram movidas para `.claude/skills/` (pasta local do projeto). As skills duplicadas (idênticas às de `~/.agents/skills/`) foram removidas da raiz. As únicas únicas do projeto (`find-skills`, `superdesign`) foram preservadas e movidas para o destino correto.

**Arquivos alterados:**
- `skills/` (pasta raiz) — removida inteiramente
- `.claude/skills/` — criada com todas as 22 skills do projeto

---

### [2026-05-13 10:15] — Criação do App Brief em Context Docs

**Descrição:**
Documento completo de briefing do produto criado em `context-docs/app-brief.md`. Cobre: o que é o produto, público-alvo, 8 ferramentas core, modelo de negócio, planos de preços, tech stack, schema do banco (10 tabelas), todas as rotas, metodologias embarcadas (Hormozi, Georgi, Vaynerchuk) e variáveis de ambiente.

**Arquivos alterados:**
- `context-docs/app-brief.md` — criado do zero

---

### [2026-05-13 10:30] — Dashboard: adição de todos os cards de features

**Descrição:**
O `DashboardHero` só exibia 5 features (Chat, Imagens, Ebooks, Prompts, Experts). Foram adicionadas as 3 features que faltavam: Planejador Social, Criador de Produto e Analista de Ofertas. O componente foi reorganizado em 4 seções lógicas: Chat (hero), Geração com IA, Ferramentas e Estratégia & Marketing. Os cards sem imagem receberam placeholders com gradiente + emoji. A rota `/dashboard/experts` foi corrigida para `/dashboard/agentes` (a `/experts` já era um redirect).

**Arquivos alterados:**
- `components/DashboardHero.tsx` — adição dos 3 novos cards, nova estrutura de seções, correção de rota

---

### [2026-05-13 10:45] — Dashboard: seção Estratégia & Marketing movida para o final

**Descrição:**
A seção "Estratégia & Marketing" foi reposicionada como a última seção do dashboard, após "Geração com IA" e "Ferramentas". Ordem final: Chat → Geração com IA → Ferramentas → Estratégia & Marketing.

**Arquivos alterados:**
- `components/DashboardHero.tsx` — reordenação dos blocos de seção

---

### [2026-05-13 11:00] — Renomeação: Analisador → Analista de Ofertas

**Descrição:**
O nome "Analisador de Oferta" foi substituído por "Analista de Ofertas" em todos os pontos de exibição do app (dashboard, menu lateral, título da página). O nome da rota `/dashboard/analisador` foi mantido para não quebrar links existentes.

**Arquivos alterados:**
- `components/DashboardHero.tsx` — label do card atualizado
- `components/Sidebar.tsx` — label do item de menu atualizado
- `app/dashboard/analisador/page.tsx` — título `<h1>` da página atualizado

---

### [2026-05-13 11:20] — Dashboard: imagens dos cards convertidas para WebP

**Descrição:**
As 6 imagens do dashboard (banner hero + 5 cards) foram recebidas em PNG (~2MB cada), convertidas para WebP com qualidade 85 via `cwebp`, resultando em redução de 89–93% no tamanho. Todos os caminhos no código foram atualizados para os novos arquivos `.webp`.

| Imagem | Antes | Depois | Redução |
|---|---|---|---|
| banner-dashboard | 2002KB | 140KB | 93% |
| chat-scaleia | 1543KB | 96KB | 93% |
| gerar-criativos | 1993KB | 202KB | 89% |
| gerar-ebooks | 1905KB | 206KB | 89% |
| biblioteca-de-prompts | 1843KB | 159KB | 91% |
| agentes-experts | 1995KB | 211KB | 89% |

**Arquivos alterados:**
- `public/stitch/` — 6 arquivos `.webp` adicionados
- `components/DashboardHero.tsx` — todos os `img` paths atualizados para `.webp`

---

### [2026-05-13 11:35] — Dashboard: hero banner mostra imagem completa sem corte

**Descrição:**
O hero banner usava `height: 42vh` com `objectFit: cover`, cortando a imagem. Também tinha um gradiente escuro sobreposto e texto "Algoritmo Milionário" renderizado por cima. Tudo isso foi removido — agora o banner é um `<img>` simples com `width: 100%` e `height: auto`, mostrando a imagem completa na proporção natural.

**Arquivos alterados:**
- `components/DashboardHero.tsx` — seção hero reescrita

---

### [2026-05-13 11:45] — Dashboard: cards mostram imagem completa sem corte

**Descrição:**
Os cards usavam um container de `height: 160px` fixo com `objectFit: cover`, cortando as imagens que têm ratio ~2.5:1. O container passou a ter `overflow: hidden` sem altura fixa, e a imagem usa `width: 100%` e `height: auto` para exibir na proporção natural. Os placeholders (cards sem imagem real) foram ajustados para `height: 220px`.

**Arquivos alterados:**
- `components/DashboardHero.tsx` — função `CardImageArea` reescrita

---

### [2026-05-13 12:00] — Dashboard: estilo unificado glassmorphism nos cards

**Descrição:**
Cada card tinha cores diferentes no background, borda e botão (`accent` e `btn` variáveis por card). Foi aplicado um estilo único glassmorphism azul-roxo para todos os cards: borda `rgba(80, 110, 255, 0.2)`, footer com gradiente escuro azul→roxo, subtítulo em azul acinzentado e botão `#3d6ef5 → #7c3aed` em todos. Hover ganhou glow azul-roxo.

**Arquivos alterados:**
- `components/DashboardHero.tsx` — constantes `GLASS_*` adicionadas, `ServiceCard` reescrito com estilo unificado

---

### [2026-05-13 12:20] — Dashboard: imagens de Estratégia & Marketing adicionadas

**Descrição:**
As 3 imagens da seção Estratégia & Marketing foram recebidas em PNG, convertidas para WebP (redução ~91%) e aplicadas nos cards corretos substituindo os placeholders emoji.

| Arquivo | Card |
|---|---|
| `planejar-conteudos.webp` | Planejador Social |
| `criar-produto.webp` | Criador de Produto |
| `analisar-oferta.webp` | Analista de Ofertas |

**Arquivos alterados:**
- `public/stitch/planejar-conteudos.webp` — adicionado
- `public/stitch/criar-produto.webp` — adicionado
- `public/stitch/analisar-oferta.webp` — adicionado
- `components/DashboardHero.tsx` — placeholders substituídos por `img` com os novos arquivos

---

### [2026-05-13 12:40] — Sidebar: ícone "SA" substituído pela logo real

**Descrição:**
O ícone "SA" gerado com gradiente CSS no topo da sidebar foi substituído pela logo oficial do produto (`only-icon-logo.png`), convertida para WebP. A logo foi salva em `/public/logo-icon.webp`.

**Arquivos alterados:**
- `public/logo-icon.webp` — adicionado (convertido de `context-docs/logo/only-icon-logo.png`)
- `components/Sidebar.tsx` — div com "SA" substituída por `<img src="/logo-icon.webp">`

---

### [2026-05-13 12:50] — Login: ícone "M" substituído pela logo completa

**Descrição:**
O ícone "M" com gradiente CSS na página de login foi substituído pela logo completa do produto (`no-bg-logo.png`), convertida para WebP e exibida com 180px de largura centralizada acima do formulário.

**Arquivos alterados:**
- `public/logo-full.webp` — adicionado (convertido de `context-docs/logo/no-bg-logo.png`)
- `app/login/page.tsx` — div com "M" substituída por `<img src="/logo-full.webp">`

---

### [2026-05-13 13:00] — Chat: estado vazio exibe logo ao invés de texto

**Descrição:**
Quando nenhum chat está selecionado/iniciado, o painel central exibia o título "Algoritmo Milionário" e o subtítulo "Construa algo incrível — comece a digitar abaixo." em texto grande. Ambos foram removidos e substituídos pela logo completa (`logo-full.webp`) centralizada com 220px de largura e opacidade 0.92.

**Arquivos alterados:**
- `app/dashboard/chat/page.tsx` — bloco de `messages.length === 0` reescrito com `<img>`

---

### [2026-05-13 14:10] — Chat: logo do estado vazio aumentada e centralizada

**Descrição:**
A logo no estado vazio do chat estava deslocada para cima e pequena demais. Dois problemas identificados: (1) existia um `<div style={{ flex: 1 }} />` spacer abaixo do container da logo que dividia o espaço ao meio e empurrava a logo para cima; (2) o top bar usa `position: absolute` (sai do fluxo flex), fazendo o ponto de centro do container começar em y=0 em vez de abaixo dos botões de modelo. Solução: removido o spacer, logo aumentada de 220px para 300px (~36%), e adicionado `paddingTop: 70` ao container para compensar o offset do top bar absoluto — centralizando visualmente entre os botões de modelo e o input.

**Arquivos alterados:**
- `app/dashboard/chat/page.tsx` — removido spacer `flex: 1`, logo aumentada para 300px, `paddingTop: 70` adicionado ao container
