// app/dashboard/imagens/page.tsx
export default function ImagensPage() {
  return (
    <div style={{ padding: '40px', maxWidth: 900, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>🖼️ Gerador de Imagens</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Crie artes, criativos e capas com IA em segundos.</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>🖼️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Em breve</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
          O gerador de imagens com IA estará disponível em breve. Você poderá criar artes, criativos para anúncios, capas de ebook e muito mais.
        </p>
        <div className="badge badge-blue" style={{ display: 'inline-flex', marginTop: 24 }}>🚧 Sprint 5-6</div>
      </div>
    </div>
  )
}
