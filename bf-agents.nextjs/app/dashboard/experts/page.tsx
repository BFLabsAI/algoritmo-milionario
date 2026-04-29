// app/dashboard/experts/page.tsx
import { createClient } from '@/lib/supabase/server'
import ExpertCard from '@/components/ExpertCard'

export default async function ExpertsPage() {
  const supabase = await createClient()
  const { data: agents } = await supabase
    .from('agents_algoritmo_milionario')
    .select('id, slug, name, description, category, required_plan, default_model')
    .eq('is_active', true)
    .order('sort_order')

  const CATEGORY_LABELS: Record<string, string> = {
    geral: 'Geral', copywriting: 'Copywriting', ads: 'Anúncios',
    email: 'Email Marketing', reels: 'Reels & Vídeo', vendas: 'Vendas',
  }

  const categories = [...new Set((agents ?? []).map(a => a.category).filter(Boolean))]

  return (
    <div style={{ padding: '40px', maxWidth: 1000, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>🤖 Experts Especializados</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Agentes treinados com expertise em marketing digital, copywriting e vendas para o mercado brasileiro.</p>
      </div>

      {categories.map(cat => {
        const catAgents = (agents ?? []).filter(a => a.category === cat)
        if (!catAgents.length) return null
        return (
          <div key={cat} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: 14, textTransform: 'uppercase' }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {catAgents.map(agent => <ExpertCard key={agent.id} agent={agent} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
