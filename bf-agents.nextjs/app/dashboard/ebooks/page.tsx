// app/dashboard/ebooks/page.tsx
export default function EbooksPage() {
  return (
    <div style={{ padding: '40px', maxWidth: 900, width: '100%' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>📚 Gerador de Ebooks</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Crie ebooks completos prontos para vender em PDF.</p>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📚</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Em breve</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
          O gerador de ebooks com IA estará disponível em breve. Defina o tema, tom e público-alvo — a IA cria o ebook completo em PDF pronto para vender.
        </p>
        <div className="badge badge-blue" style={{ display: 'inline-flex', marginTop: 24 }}>🚧 Sprint 5-6</div>
      </div>
    </div>
  )
}
