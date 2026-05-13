// app/dashboard/configuracoes/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.user_metadata?.full_name || ''
  const email = user?.email || ''

  return (
    <div style={{ padding: '40px', maxWidth: 700, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>⚙️ Configurações</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Gerencie seu perfil e assinatura.</p>
      </div>

      {/* Perfil */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Perfil</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>Nome completo</label>
            <input className="input" defaultValue={name} placeholder="Seu nome" readOnly style={{ opacity: 0.7 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>E-mail</label>
            <input className="input" defaultValue={email} readOnly style={{ opacity: 0.7 }} />
          </div>
        </div>
      </div>

      {/* Plano */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Plano Atual</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>🆓</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Gratuito</span>
              <span className="badge badge-blue">Ativo</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>30 mensagens · 5 imagens · 1 ebook por mês</p>
          </div>
          <button className="btn btn-primary">Fazer upgrade →</button>
        </div>
      </div>

      {/* Planos */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Planos Disponíveis</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { name: 'Pro', price: 'R$ 97/mês', icon: '⚡', badge: 'badge-purple', desc: '500 msgs · 50 imagens · 10 ebooks · Todos os modelos', color: 'var(--purple)' },
            { name: 'Premium', price: 'R$ 197/mês', icon: '👑', badge: 'badge-gold', desc: 'Ilimitado · Modelos exclusivos (Claude Opus, o3) · Prioridade', color: 'var(--gold)' },
          ].map(plan => (
            <div key={plan.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderRadius: 12, border: `1px solid ${plan.color}30`,
              background: `${plan.color}08`, flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{plan.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 3 }}>{plan.name} — {plan.price}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{plan.desc}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm">Assinar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
