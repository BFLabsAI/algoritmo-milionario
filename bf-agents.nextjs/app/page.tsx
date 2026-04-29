// app/page.tsx — Landing Page pública
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>M</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Algoritmo Milionário</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Entrar</Link>
          <Link href="/register" className="btn btn-primary btn-sm">Começar grátis</Link>
        </div>
      </header>

      {/* HERO */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
        <div className="fade-in">
          <div className="badge badge-blue" style={{ marginBottom: 24 }}>
            ✦ Plataforma de IA para Infoprodutores
          </div>
          <h1 style={{
            fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1,
            background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 24, maxWidth: 800,
          }}>
            A IA que transforma <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>conhecimento em renda</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, maxWidth: 560, lineHeight: 1.7, marginBottom: 40 }}>
            Chat com os melhores modelos de IA, agentes experts em copywriting, geração de imagens e ebooks — tudo em um único hub.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Começar gratuitamente →
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              Já tenho conta
            </Link>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20, marginTop: 80, maxWidth: 900, width: '100%',
        }}>
          {[
            { icon: '💬', title: 'Chat Multi-Modelo', desc: 'GPT-4o, Claude, Gemini, DeepSeek e mais em um único lugar.' },
            { icon: '🤖', title: 'Experts Especializados', desc: 'Agentes treinados em copywriting, ads, email e reels.' },
            { icon: '🖼️', title: 'Geração de Imagens', desc: 'Crie artes, capas e criativos com IA em segundos.' },
            { icon: '📚', title: 'Gerador de Ebooks', desc: 'Produza ebooks completos prontos para vender.' },
          ].map((f) => (
            <div key={f.title} className="card card-interactive fade-in" style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '20px 40px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
        © 2026 Algoritmo Milionário — BF Labs AI
      </footer>
    </div>
  )
}
