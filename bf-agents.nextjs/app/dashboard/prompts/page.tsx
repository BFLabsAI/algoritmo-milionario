// app/dashboard/prompts/page.tsx
import { createClient } from '@/lib/supabase/server'
import PromptCard from '@/components/PromptCard'

export default async function PromptsPage() {
  const supabase = await createClient()
  const { data: prompts } = await supabase
    .from('prompts_algoritmo_milionario')
    .select('id, title, description, content, category, required_plan, model_slug')
    .eq('is_active', true)
    .order('sort_order')

  const CATS: Record<string, string> = { copywriting: '✍️ Copywriting', ads: '📣 Anúncios', email: '📧 Email', reels: '🎬 Reels', vendas: '💰 Vendas', estrategia: '🎯 Estratégia' }
  const categories = [...new Set((prompts ?? []).map(p => p.category).filter(Boolean))]

  return (
    <div style={{ padding: '40px', maxWidth: 1000, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>⚡ Biblioteca de Prompts</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Prompts prontos para copywriting, anúncios, e-mail marketing e muito mais.</p>
      </div>
      {categories.map(cat => {
        const catPrompts = (prompts ?? []).filter(p => p.category === cat)
        if (!catPrompts.length) return null
        return (
          <div key={cat} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: 14, textTransform: 'uppercase' }}>
              {CATS[cat] ?? cat}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {catPrompts.map(p => <PromptCard key={p.id} prompt={p} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
