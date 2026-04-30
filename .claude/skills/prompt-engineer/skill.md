---
name: prompt-engineer
description: >-
  Full-stack prompt engineering skill — covers every stage of prompt work in
  one place. TRIGGER when: user says "optimize this prompt", "refine my prompt",
  "improve my prompt", "enhance this prompt", "polish this prompt",
  "finalize this prompt file", "boost my prompt", "help me write a prompt for",
  "write a better prompt for", "how should I prompt for X", or pastes a draft
  prompt and asks for feedback or improvement. Also triggers on:
  "otimizar prompt", "melhorar prompt". Handles four modes: deep optimization
  with ECC component matching, interactive Q&A refinement, UI/Stitch prompt
  enhancement with design system injection, and polishing existing prompt files.
  DO NOT TRIGGER when: user wants the task executed directly ("just do it",
  "execute this") or when the word "optimize" refers to code/performance rather
  than a prompt.
allowed-tools:
  - Read
  - Write
  - Bash
---

# Prompt Engineer

Full-stack prompt engineering in four modes. Detect the user's intent and route to the right one.

## Mode Detection

| Signal | Mode |
|--------|------|
| User pastes a prompt + wants critique, optimization, or ECC component matching | **Optimize** |
| User has a vague idea and wants structured Q&A to build a prompt | **Boost** |
| User wants a prompt for a UI page, screen, or Stitch generation | **Enhance (Stitch)** |
| User points to an existing prompt file and asks to polish or finalize it | **Finalize** |

When in doubt, default to **Optimize**.

---

## Mode 1: Optimize

Analyze, critique, and rewrite the prompt. Advisory only — do not execute the task itself.

### Phase 0: Project Detection

Check for `CLAUDE.md` and detect tech stack:
- `package.json` → Node.js / TypeScript / React / Next.js
- `go.mod` → Go
- `pyproject.toml` / `requirements.txt` → Python
- `Cargo.toml` → Rust
- `build.gradle` / `pom.xml` → Java / Kotlin
- `*.csproj` → .NET | `Gemfile` → Ruby | `composer.json` → PHP

### Phase 1: Intent & Scope

Classify intent: New Feature / Bug Fix / Refactor / Research / Testing / Review / Documentation / Infrastructure / Design

Scope heuristics:

| Scope | Signal | Approach |
|-------|--------|----------|
| TRIVIAL | Single file, <50 lines | Direct execution |
| LOW | Single component | One skill or command |
| MEDIUM | Multiple components, same domain | Command chain + /verify |
| HIGH | Cross-domain, 5+ files | /plan first, phased |
| EPIC | Multi-session, architectural | Blueprint skill |

### Phase 2: Missing Context

Scan for gaps — tech stack, acceptance criteria, scope boundaries, security requirements, testing expectations, existing patterns to follow. If 3+ critical items are missing, ask up to 3 clarifying questions before generating the output, then incorporate the answers.

### Phase 3: ECC Component Matching

Map intent + scope + stack to ECC components:

| Intent | Commands | Skills / Agents |
|--------|----------|----------------|
| New Feature | /plan, /tdd, /verify | tdd-workflow, code-reviewer |
| Bug Fix | /tdd, /build-fix, /verify | tdd-workflow |
| Refactor | /refactor-clean, /verify | verification-loop, code-reviewer |
| Research | /plan | search-first |
| Testing | /tdd, /e2e | tdd-workflow, e2e-testing |
| Review | /code-review | security-review |
| Infrastructure | /plan, /verify | deployment-architect |
| Design / EPIC | — | blueprint skill (not a command) |

Model recommendations:
- TRIVIAL–LOW → Sonnet 4.6 (fast, cost-efficient)
- MEDIUM → Sonnet 4.6
- HIGH → Sonnet 4.6 for implementation + Opus 4.7 for architecture planning
- EPIC → Opus 4.7 for blueprint + Sonnet 4.6 for phase execution

### Output Format

1. **Prompt Diagnosis** — strengths, issues table (Issue / Impact / Suggested Fix), clarifying questions if needed
2. **Recommended ECC Components** — table: Type / Component / Purpose
3. **Optimized Prompt — Full Version** — self-contained, copy-paste ready, in a fenced code block. Must include: task description, tech stack, /command invocations at the right workflow stages, acceptance criteria, verification steps, scope boundaries ("do not do X")
4. **Optimized Prompt — Quick Version** — compact one-liner for experienced users. Example patterns:
   - New Feature: `/plan [feature]. /tdd to implement. /code-review. /verify.`
   - Bug Fix: `/tdd — write failing test for [bug]. Fix to green. /verify.`
   - EPIC: `Use blueprint skill for "[objective]". Execute phases with /verify gates.`
5. **Enhancement Rationale** — table: Enhancement / Reason

> Footer: *Not what you need? Tell me what to adjust, or make a normal task request if you want execution instead of prompt optimization.*

---

## Mode 2: Boost (Interactive Refinement)

Build a polished prompt from scratch through structured Q&A. Never write code — only produce the final prompt.

1. Ask targeted questions to understand scope, deliverables, constraints, success criteria, and technical requirements. Explore the project with available tools to fill gaps before asking the user.
2. Iterate until the prompt is complete and unambiguous.
3. Output the final prompt as clean markdown.
4. If the Joyride extension is available, copy it to the clipboard:
   ```clojure
   (require '["vscode" :as vscode])
   (vscode/env.clipboard.writeText "your-markdown-text-here")
   ```
   Tell the user it's on the clipboard, then ask if they want any changes. Repeat after each revision.

---

## Mode 3: Enhance (Stitch / UI)

Transform a vague UI idea into a structured, Stitch-optimized prompt with design system context.

Before enhancing, check the [Stitch Effective Prompting Guide](https://stitch.withgoogle.com/docs/learn/prompting/) for the latest best practices.

### Steps

**1. Assess what's missing:** platform, page type, visual style, colors, component names.

**2. Check for DESIGN.md** in the project root.
- Found → extract color palette, typography, component styles and inject them as a "DESIGN SYSTEM (REQUIRED)" block.
- Not found → append this tip at the end of the enhanced prompt:
  ```
  💡 Tip: For consistent designs across screens, create a DESIGN.md file
  using the `design-md` skill.
  ```

**3. Apply enhancements:**
- Replace vague terms with specific component names: "menu at the top" → "navigation bar with logo and menu items"; "list of items" → "card grid layout"
- Add mood adjectives: "modern" → "clean, minimal, with generous whitespace"; "professional" → "sophisticated, trustworthy, with subtle shadows"
- Organize into numbered page sections with clear labels
- Format colors as: `Descriptive Name (#hex) for functional role`

**4. Output structure:**
```markdown
[One-line description of page purpose and vibe]

**DESIGN SYSTEM (REQUIRED):**
- Platform: [Web/Mobile], [Desktop/Mobile]-first
- Theme: [Light/Dark], [style descriptors]
- Background: [Name] (#hex)
- Primary Accent: [Name] (#hex) for [role]
- Text Primary: [Name] (#hex)

**Page Structure:**
1. **[Section]:** [Description]
2. **[Section]:** [Description]
...
```

For targeted edits ("add a search bar"), output specific changes with location, style details, and a clear "make only this change, preserve everything else" instruction.

---

## Mode 4: Finalize (Polish Prompt File)

Polish an existing prompt file — sharpen clarity, fix grammar, improve structure — without changing intent.

1. Read the prompt file. Ask for it if none was provided.
2. Preserve frontmatter, encoding, and markdown structure exactly.
3. Refine: fix spelling and grammar, improve wording, tighten structure, align with proven prompt writing patterns (explain the *why*, use imperative form, avoid over-rigid MUSTs).
4. Write the improved file back.
5. Summarize what changed and why.

---

## Principles That Apply Across All Modes

- Explain the *why* behind instructions — models follow reasoning better than rigid commands
- Acceptance criteria and scope boundaries ("do not do X") are always worth adding; they prevent scope creep and reduce back-and-forth
- For EPIC scope, always route to the blueprint skill — stuffing everything into one prompt produces worse results than phased execution
- Keep prompts self-contained — the reader shouldn't need outside context to execute them
- Specificity beats vagueness: named files, concrete acceptance criteria, and explicit non-goals make every prompt more executable
