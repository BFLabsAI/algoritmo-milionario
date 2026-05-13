// app/dashboard/agentes/page.tsx
import { createAdminClient } from '@/lib/supabase/server'
import ExpertCard from '@/components/ExpertCard'

export default async function AgentesPage() {
  const supabase = createAdminClient()
  const { data: agents } = await supabase
    .from('agents_algoritmo_milionario')
    .select('id, slug, name, description, category, required_plan, default_model')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div
      style={{
        position: 'relative', width: '100%', minHeight: '100%',
        background: `radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 20%, #0a1628 0%, transparent 50%),
                     radial-gradient(ellipse at 50% 80%, #0d2137 0%, transparent 50%),
                     #080810`,
      }}
    >
      <div className="aurora-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '40px', width: '100%' }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Agentes Especializados
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Agentes com IA treinada em marketing digital, copywriting e vendas para o mercado brasileiro.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {(agents ?? []).map(agent => <ExpertCard key={agent.id} agent={agent} />)}
        </div>

        {(!agents || agents.length === 0) && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
            <p style={{ fontSize: 15 }}>Agentes em breve...</p>
          </div>
        )}
      </div>
    </div>
  )
}
