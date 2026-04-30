import { createAdminClient } from '@/lib/supabase/server'
import PromptCategoryRail from '@/components/PromptCategoryRail'

type PromptRow = {
  id: string
  title: string
  description: string | null
  content: string
  category: string | null
  required_plan: string
  model_slug: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  copywriting: 'Copywriting',
  ads: 'Anúncios',
  email: 'Email',
  reels: 'Reels',
  vendas: 'Vendas',
  estrategia: 'Estratégia',
}

function getCategoryLabel(category: string) {
  return CATEGORY_LABELS[category] ?? category
}

export default async function PromptsPage() {
  const supabase = createAdminClient()
  const { data: prompts } = await supabase
    .from('prompts_algoritmo_milionario')
    .select('id, title, description, content, category, required_plan, model_slug')
    .eq('is_active', true)
    .order('sort_order')

  const promptRows = (prompts ?? []) as PromptRow[]
  const categories = [...new Set(promptRows.map(p => p.category).filter(Boolean))] as string[]
  const totalPrompts = promptRows.length
  const modelCount = new Set(promptRows.map(p => p.model_slug).filter(Boolean)).size

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100%',
        background: `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 80%, #0d2137 0%, transparent 50%),
                     #080810`,
      }}
    >
      <div className="aurora-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 28px 64px',
        }}
      >
        <section
          style={{
            maxWidth: 860,
            margin: '0 auto 34px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 9999,
              background: 'rgba(76,201,240,0.08)',
              border: '1px solid rgba(76,201,240,0.16)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              color: '#d8f8ff',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.02em',
              marginBottom: 18,
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 9999,
                background: 'linear-gradient(135deg, #4cc9f0 0%, #a855f7 100%)',
                boxShadow: '0 0 16px rgba(168,85,247,0.35)',
              }}
            />
            Algoritmo Milionário
          </div>

          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 'clamp(36px, 5vw, 58px)',
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              marginBottom: 14,
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 52%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Biblioteca de Prompts
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: '0 auto',
              color: '#94a3b8',
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Prompts prontos para copywriting, anúncios, email, reels, vendas e estratégia.
            Tudo no mesmo sistema visual do nosso estúdio de ebooks.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 10,
              marginTop: 22,
            }}
          >
            <StatPill label="Prompts ativos" value={String(totalPrompts)} />
            <StatPill label="Categorias" value={String(categories.length)} />
            <StatPill label="Modelos" value={String(modelCount)} />
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {categories.length ? (
            categories.map(category => {
              const catPrompts = promptRows.filter(p => p.category === category)
              if (!catPrompts.length) return null

              return (
                <PromptCategoryRail
                  key={category}
                  title={getCategoryLabel(category)}
                  subtitle="Prompts prontos para aplicar no nosso sistema"
                  count={catPrompts.length}
                  prompts={catPrompts}
                />
              )
            })
          ) : (
            <section
              style={{
                borderRadius: 28,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.34)',
                backdropFilter: 'blur(24px)',
                overflow: 'hidden',
                padding: '44px 24px 56px',
                textAlign: 'center',
                color: '#94a3b8',
              }}
            >
              Nenhum prompt ativo encontrado.
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        minWidth: 148,
        padding: '12px 16px',
        borderRadius: 18,
        background: 'rgba(22,16,40,0.72)',
        border: '1px solid rgba(168,85,247,0.14)',
        boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(16px)',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: '#fff',
          fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  )
}
