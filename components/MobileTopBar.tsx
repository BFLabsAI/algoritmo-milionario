'use client'

interface MobileTopBarProps {
  onMenuOpen: () => void
}

export default function MobileTopBar({ onMenuOpen }: MobileTopBarProps) {
  return (
    <>
      <style>{`
        .mobile-top-bar { display: none; }
        @media (max-width: 767px) { .mobile-top-bar { display: flex; } }
      `}</style>
      <header
        className="mobile-top-bar"
        style={{
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 56,
          background: '#08090f',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          flexShrink: 0,
        }}
      >
      <button
        onClick={onMenuOpen}
        aria-label="Abrir menu de navegação"
        aria-expanded={false}
        aria-controls="sidebar-nav"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          width: 48,
          height: 48,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span style={{ display: 'block', width: 18, height: 2, background: '#94a3b8', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 18, height: 2, background: '#94a3b8', borderRadius: 2 }} />
        <span style={{ display: 'block', width: 18, height: 2, background: '#94a3b8', borderRadius: 2 }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/logo-icon.webp"
          alt="Algoritmo Milionário"
          style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'contain' }}
        />
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Algoritmo Milionário
        </span>
      </div>
    </header>
    </>
  )
}
