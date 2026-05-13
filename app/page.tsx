'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MessageSquare,
  Bot,
  ImageIcon,
  BookOpen,
  Zap,
  Calendar,
  Lightbulb,
  ScanSearch,
  Check,
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  Sparkles,
  ChevronRight,
  BarChart3,
  Layers,
  Play,
  Lock,
  Globe,
  TrendingUp,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const GLOW_GRADIENT = 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 35%, #8b5cf6 70%, #7c3aed 100%)'
const TEXT_GRADIENT = 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)'
const GLASS = {
  background: 'rgba(25, 30, 45, 0.65)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  borderRadius: 24,
}

/* ------------------------------------------------------------------ */
/*  UTILITIES                                                          */
/* ------------------------------------------------------------------ */

function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

  return { ref, visible }
}

/* ------------------------------------------------------------------ */
/*  SECTIONS                                                           */
/* ------------------------------------------------------------------ */

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Funcionalidades', href: '#funcionalidades' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Preços', href: '#precos' },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(8,10,22,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: GLOW_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(76,201,240,0.3)',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#fff',
              letterSpacing: '-0.5px',
            }}
          >
            Algoritmo Milionário
          </span>
        </a>

        {/* Desktop links */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#94a3b8',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop buttons */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="/login"
            style={{
              padding: '8px 18px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              color: '#94a3b8',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const t = e.target as HTMLElement
              t.style.background = 'rgba(255,255,255,0.05)'
              t.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              const t = e.target as HTMLElement
              t.style.background = 'transparent'
              t.style.color = '#94a3b8'
            }}
          >
            Entrar
          </a>
          <a
            href="#precos"
            style={{
              padding: '8px 18px',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              background: GLOW_GRADIENT,
              boxShadow: '0 0 20px rgba(139,92,246,0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 28px rgba(76,201,240,0.4)'
              t.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 20px rgba(139,92,246,0.25)'
              t.style.transform = 'translateY(0)'
            }}
          >
            Começar Grátis
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hide-desktop"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu de navegação'}
          aria-expanded={open}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: 10,
            minWidth: 44,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="hide-desktop fade-in"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(8,10,22,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ fontSize: 15, fontWeight: 500, color: '#94a3b8', textDecoration: 'none' }}
            >
              {l.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <a
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 0',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                color: '#94a3b8',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Entrar
            </a>
            <a
              href="#precos"
              onClick={() => setOpen(false)}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 0',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                textDecoration: 'none',
                background: GLOW_GRADIENT,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Começar Grátis
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero() {
  const { ref, visible } = useScrollReveal()

  return (
    <section
      ref={ref}
      className="aurora-bg"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: 'clamp(60px, 10vw, 120px) 24px clamp(80px, 12vw, 140px)',
        textAlign: 'center',
      }}
    >
      {/* Radial glows */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(76,201,240,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '60%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            marginBottom: 32,
          }}
        >
          <Sparkles size={14} color="#c4b5fd" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.3px' }}>
            Plataforma de IA para Infoprodutores
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(36px, 6vw, 72px)',
            lineHeight: 1.08,
            letterSpacing: '-1.5px',
            marginBottom: 24,
            background: TEXT_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Crie, Escale e Venda
          <br />
          com Inteligência Artificial
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            lineHeight: 1.6,
            color: '#94a3b8',
            maxWidth: 640,
            margin: '0 auto 40px',
          }}
        >
          A plataforma definitiva para infoprodutores. Chat multi-modelo, agentes especializados,
          geração de imagens, ebooks e tudo que você precisa para escalar seu negócio digital.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#precos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              background: GLOW_GRADIENT,
              boxShadow: '0 0 24px rgba(139,92,246,0.3)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 36px rgba(76,201,240,0.45)'
              t.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 24px rgba(139,92,246,0.3)'
              t.style.transform = 'translateY(0)'
            }}
          >
            Começar Grátis <ArrowRight size={18} />
          </a>
          <a
            href="#como-funciona"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              color: '#94a3b8',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              const t = e.target as HTMLElement
              t.style.background = 'rgba(255,255,255,0.05)'
              t.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              const t = e.target as HTMLElement
              t.style.background = 'transparent'
              t.style.color = '#94a3b8'
            }}
          >
            <Play size={18} /> Ver Demonstração
          </a>
        </div>
      </div>

      {/* Dashboard mockup */}
      <div
        style={{
          maxWidth: 960,
          margin: '64px auto 0',
          position: 'relative',
          zIndex: 2,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 1s ease 0.2s, transform 1s ease 0.2s',
        }}
      >
        <div
          style={{
            ...GLASS,
            borderRadius: 20,
            padding: 'clamp(16px, 3vw, 32px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Mockup header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
            <div
              style={{
                marginLeft: 'auto',
                padding: '4px 12px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                fontSize: 11,
                color: '#64748b',
              }}
            >
              dashboard.algoritmomilionario.com
            </div>
          </div>

          {/* Mockup body */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {/* Sidebar mock */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {['Dashboard', 'Chat IA', 'Agentes', 'Ebooks', 'Imagens', 'Análises'].map((item, i) => (
                <div
                  key={item}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: i === 1 ? 600 : 400,
                    color: i === 1 ? '#fff' : '#64748b',
                    background: i === 1 ? 'rgba(139,92,246,0.15)' : 'transparent',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main mock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 12,
                      padding: 16,
                      height: 80,
                    }}
                  >
                    <div
                      style={{
                        width: '40%',
                        height: 10,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        marginBottom: 12,
                      }}
                    />
                    <div
                      style={{ width: '70%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: 20,
                  flex: 1,
                  minHeight: 120,
                }}
              >
                <div
                  style={{
                    width: '30%',
                    height: 10,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.06)',
                    marginBottom: 16,
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      style={{
                        width: `${60 + n * 10}%`,
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SocialProof() {
  const { ref, visible } = useScrollReveal()
  const logos = ['GrowthLab', 'ContentPro', 'DigitalScale', 'InfoMaster', 'VendaMais', 'CreatorHub']

  return (
    <section
      ref={ref}
      style={{
        padding: '40px 24px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#475569',
            marginBottom: 24,
          }}
        >
          Confiado por criadores de conteúdo e infoprodutores
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'clamp(24px, 5vw, 56px)',
            flexWrap: 'wrap',
          }}
        >
          {logos.map((name) => (
            <span
              key={name}
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(14px, 2vw, 18px)',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Funcionalidades() {
  const { ref, visible } = useScrollReveal()
  const items = [
    {
      icon: <MessageSquare size={24} color="#c4b5fd" />,
      title: 'Chat Multi-Modelo',
      desc: 'Acesse GPT-4, Claude, Gemini e mais em um único lugar. Troque de modelo sem perder o contexto.',
    },
    {
      icon: <Bot size={24} color="#8b5cf6" />,
      title: 'Agentes Experts',
      desc: 'Agentes especializados em copywriting, vendas, SEO e estratégia prontos para ajudar 24/7.',
    },
    {
      icon: <ImageIcon size={24} color="#8b5cf6" />,
      title: 'Geração de Imagens',
      desc: 'Crie artes para redes sociais, capas de ebook e anúncios com IA de última geração.',
    },
    {
      icon: <BookOpen size={24} color="#c4b5fd" />,
      title: 'Criador de Ebooks',
      desc: 'Gere ebooks completos com capítulos, sumário e formatação profissional em minutos.',
    },
    {
      icon: <Calendar size={24} color="#8b5cf6" />,
      title: 'Planejador Social',
      desc: 'Planeje, crie e agende conteúdo para todas as suas redes sociais com um clique.',
    },
    {
      icon: <Zap size={24} color="#8b5cf6" />,
      title: 'Criador de Produtos',
      desc: 'Estruture cursos, mentorias e produtos digitais com frameworks validados pelo mercado.',
    },
    {
      icon: <ScanSearch size={24} color="#c4b5fd" />,
      title: 'Analista de Oferta',
      desc: 'Analise sua oferta, identifique gaps e receba recomendações para aumentar conversão.',
    },
    {
      icon: <Layers size={24} color="#8b5cf6" />,
      title: 'Biblioteca de Prompts',
      desc: 'Centenas de prompts prontos e otimizados para infoprodutores e marketing digital.',
    },
  ]

  return (
    <section id="funcionalidades" ref={ref} style={{ padding: 'clamp(60px, 10vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 99,
              background: 'rgba(76,201,240,0.1)',
              color: '#c4b5fd',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Funcionalidades
          </span>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Tudo que você precisa para escalar
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8', maxWidth: 560, margin: '0 auto' }}>
            Uma suite completa de ferramentas de IA projetada especificamente para quem cria e vende conhecimento.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {items.map((item, i) => (
            <div
              key={item.title}
              style={{
                ...GLASS,
                padding: '28px',
                position: 'relative',
                overflow: 'hidden',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`,
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget
                t.style.transform = 'translateY(-8px)'
                t.style.boxShadow = '0 8px 40px rgba(76,201,240,0.15), 0 4px 30px rgba(0,0,0,0.5)'
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget
                t.style.transform = 'translateY(0)'
                t.style.boxShadow = '0 4px 30px rgba(0,0,0,0.5)'
              }}
            >
              {/* Glow border on hover */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 24,
                  padding: 1,
                  background: 'linear-gradient(135deg, rgba(76,201,240,0.3), rgba(139,92,246,0.3))',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                }}
                className="card-glow"
              />
              <div style={{ marginBottom: 16 }}>{item.icon}</div>
              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 17,
                  color: '#fff',
                  marginBottom: 8,
                }}
              >
                {item.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: '#94a3b8' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .card-glow {
          opacity: 0;
        }
        div:hover > .card-glow {
          opacity: 1 !important;
        }
      `}</style>
    </section>
  )
}

function ComoFunciona() {
  const { ref, visible } = useScrollReveal()
  const steps = [
    {
      icon: <Users size={28} color="#c4b5fd" />,
      title: 'Crie sua conta',
      desc: 'Cadastre-se em menos de 1 minuto. Sem cartão de crédito, sem complicação. Acesso imediato ao dashboard.',
    },
    {
      icon: <Sparkles size={28} color="#8b5cf6" />,
      title: 'Escolha sua ferramenta',
      desc: 'Navegue entre chat, agentes, gerador de ebooks, imagens e planejador social. Tudo integrado.',
    },
    {
      icon: <MessageSquare size={28} color="#8b5cf6" />,
      title: 'Interaja com a IA',
      desc: 'Use prompts prontos ou crie seus próprios comandos. A IA entende contexto e entrega resultados profissionais.',
    },
    {
      icon: <TrendingUp size={28} color="#c4b5fd" />,
      title: 'Escale seus resultados',
      desc: 'Exporte, publique e acompanhe métricas. Crie mais em menos tempo e converta melhor.',
    },
  ]

  return (
    <section
      id="como-funciona"
      ref={ref}
      style={{ padding: 'clamp(60px, 10vw, 100px) 24px', background: 'rgba(255,255,255,0.02)' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 99,
              background: 'rgba(139,92,246,0.1)',
              color: '#8b5cf6',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Como Funciona
          </span>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Quatro passos para transformar sua produção
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8', maxWidth: 520, margin: '0 auto' }}>
            Comece a usar em minutos. Nossa plataforma foi desenhada para ser intuitiva e poderosa.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {steps.map((step, i) => (
            <div
              key={step.title}
              style={{
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s`,
              }}
            >
              {/* Number + connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: 'rgba(25,30,45,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  }}
                >
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 48,
                      background: 'linear-gradient(180deg, rgba(76,201,240,0.3), rgba(139,92,246,0.3))',
                      marginTop: 8,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingTop: 8, paddingBottom: i < steps.length - 1 ? 32 : 0 }}>
                <div
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    color: '#64748b',
                    marginBottom: 6,
                    letterSpacing: '0.5px',
                  }}
                >
                  PASSO 0{i + 1}
                </div>
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#fff',
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#94a3b8', maxWidth: 480 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Demonstracao() {
  const { ref, visible } = useScrollReveal()

  return (
    <section ref={ref} style={{ padding: 'clamp(60px, 10vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 99,
              background: 'rgba(58,134,255,0.1)',
              color: '#8b5cf6',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Veja por Dentro
          </span>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Uma plataforma pensada para resultados
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8', maxWidth: 560, margin: '0 auto' }}>
            Interface limpa, dark mode nativo e ferramentas que realmente aceleram seu workflow.
          </p>
        </div>

        <div
          style={{
            ...GLASS,
            padding: 'clamp(20px, 3vw, 40px)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* Before / After toggle mock */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 28,
            }}
          >
            {['Antes', 'Depois'].map((label, i) => (
              <button
                key={label}
                style={{
                  padding: '8px 20px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'default',
                  background: i === 1 ? GLOW_GRADIENT : 'rgba(255,255,255,0.05)',
                  color: i === 1 ? '#fff' : '#64748b',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Before */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 16,
                padding: 24,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 16, letterSpacing: '0.5px' }}>
                ANTES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Escrever copy manualmente', 'Criar imagem no Canva', 'Planejar posts no Excel', 'Gerar ebook no Word'].map(
                  (item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'rgba(239,68,68,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={10} color="#ef4444" />
                      </div>
                      <span style={{ fontSize: 14, color: '#64748b' }}>{item}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* After */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 16,
                padding: 24,
                border: '1px solid rgba(76,201,240,0.15)',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', marginBottom: 16, letterSpacing: '0.5px' }}>
                DEPOIS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Copy gerada pela IA em segundos',
                  'Imagens criadas com prompt',
                  'Calendário social automático',
                  'Ebook completo com um clique',
                ].map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(34,197,94,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={10} color="#22c55e" />
                    </div>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Depoimentos() {
  const { ref, visible } = useScrollReveal()
  const depoimentos = [
    {
      name: 'Mariana Silva',
      role: 'Criadora de Conteúdo',
      text: 'Consegui lançar 3 ebooks em um mês usando o criador de ebooks. O que levava semanas agora leva horas. Minha produtividade triplicou.',
      gradient: 'linear-gradient(135deg, #c4b5fd, #8b5cf6)',
      initials: 'MS',
    },
    {
      name: 'Ricardo Mendes',
      role: 'Infoprodutor',
      text: 'O chat multi-modelo mudou minha forma de trabalhar. Testo ideias no Claude, refino no GPT-4 e crio imagens sem sair da plataforma.',
      gradient: 'linear-gradient(135deg, #8b5cf6, #b5179e)',
      initials: 'RM',
    },
    {
      name: 'Ana Paula Costa',
      role: 'Social Media Manager',
      text: 'O planejador social economizou 10h da minha semana. Planejo, crio e agendo conteúdo para 5 clientes em um único lugar.',
      gradient: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)',
      initials: 'AC',
    },
  ]

  return (
    <section ref={ref} style={{ padding: 'clamp(60px, 10vw, 100px) 24px', background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            O que dizem nossos usuários
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8' }}>
            Junte-se a centenas de criadores que já transformaram seu workflow.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {depoimentos.map((d, i) => (
            <div
              key={d.name}
              style={{
                ...GLASS,
                padding: 28,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
              }}
            >
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} color="#f59e0b" fill="#f59e0b" />
                ))}
              </div>
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: '#cbd5e1',
                  marginBottom: 20,
                  fontStyle: 'italic',
                }}
              >
                "{d.text}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: d.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {d.initials}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{d.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Precos() {
  const { ref, visible } = useScrollReveal()
  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      desc: 'Perfeito para começar e testar a plataforma.',
      features: ['Chat básico (GPT-3.5)', '5 prompts por dia', '1 agente', 'Suporte por email'],
      cta: 'Criar Conta',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: 'R$ 97',
      period: '/mês',
      desc: 'Para quem quer produzir em escala com IA.',
      features: [
        'Chat multi-modelo (GPT-4, Claude, Gemini)',
        'Prompts ilimitados',
        '10 agentes especializados',
        'Gerador de ebooks',
        'Gerador de imagens',
        'Planejador social',
        'Suporte prioritário',
      ],
      cta: 'Começar Pro',
      highlighted: true,
    },
    {
      name: 'Empresarial',
      price: 'R$ 297',
      period: '/mês',
      desc: 'Para equipes e negócios em crescimento.',
      features: [
        'Tudo do plano Pro',
        'Usuários ilimitados',
        'Agentes customizados',
        'API access',
        'Integrações avançadas',
        'Onboarding dedicado',
        'SLA garantido',
      ],
      cta: 'Falar com Vendas',
      highlighted: false,
    },
  ]

  return (
    <section id="precos" ref={ref} style={{ padding: 'clamp(60px, 10vw, 100px) 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: 99,
              background: 'rgba(245,158,11,0.1)',
              color: '#f59e0b',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            Preços
          </span>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 12,
            }}
          >
            Escolha seu plano
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8' }}>
            Comece grátis. Escale quando estiver pronto. Sem contratos, cancele quando quiser.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            alignItems: 'start',
          }}
        >
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              style={{
                ...GLASS,
                padding: '32px 28px',
                border: plan.highlighted ? '1px solid rgba(76,201,240,0.25)' : GLASS.border,
                boxShadow: plan.highlighted
                  ? '0 0 40px rgba(76,201,240,0.12), 0 4px 30px rgba(0,0,0,0.5)'
                  : GLASS.boxShadow,
                position: 'relative',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
              }}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    padding: '4px 14px',
                    borderRadius: 99,
                    background: GLOW_GRADIENT,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '0.5px',
                  }}
                >
                  MAIS POPULAR
                </div>
              )}

              <h3
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#fff',
                  marginBottom: 8,
                }}
              >
                {plan.name}
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, minHeight: 40 }}>{plan.desc}</p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                <span
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: 'clamp(32px, 4vw, 40px)',
                    color: '#fff',
                    letterSpacing: '-1px',
                  }}
                >
                  {plan.price}
                </span>
                <span style={{ fontSize: 14, color: '#64748b' }}>{plan.period}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Check size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <a
                href="#"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'center',
                  padding: '12px 0',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  color: plan.highlighted ? '#fff' : '#94a3b8',
                  textDecoration: 'none',
                  background: plan.highlighted ? GLOW_GRADIENT : 'transparent',
                  border: plan.highlighted ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: plan.highlighted ? '0 0 20px rgba(139,92,246,0.25)' : 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  const t = e.target as HTMLElement
                  if (plan.highlighted) {
                    t.style.boxShadow = '0 0 28px rgba(76,201,240,0.4)'
                    t.style.transform = 'translateY(-1px)'
                  } else {
                    t.style.background = 'rgba(255,255,255,0.05)'
                    t.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  const t = e.target as HTMLElement
                  if (plan.highlighted) {
                    t.style.boxShadow = '0 0 20px rgba(139,92,246,0.25)'
                    t.style.transform = 'translateY(0)'
                  } else {
                    t.style.background = 'transparent'
                    t.style.color = '#94a3b8'
                  }
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaFinal() {
  const { ref, visible } = useScrollReveal()

  return (
    <section ref={ref} style={{ padding: 'clamp(60px, 10vw, 100px) 24px' }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
          ...GLASS,
          padding: 'clamp(40px, 6vw, 64px) clamp(24px, 5vw, 48px)',
          background: 'linear-gradient(135deg, rgba(25,30,45,0.9), rgba(15,20,35,0.95))',
          border: '1px solid rgba(76,201,240,0.15)',
          position: 'relative',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Glow behind */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(76,201,240,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 40px)',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              background: TEXT_GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 16,
            }}
          >
            Pronto para multiplicar sua produtividade?
          </h2>
          <p style={{ fontSize: 'clamp(15px, 2vw, 18px)', color: '#94a3b8', maxWidth: 520, margin: '0 auto 32px' }}>
            Junte-se a centenas de infoprodutores que já usam o Algoritmo Milionário para criar mais, vender mais e
            escalar seus negócios.
          </p>
          <a
            href="#precos"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 32px',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              background: GLOW_GRADIENT,
              boxShadow: '0 0 28px rgba(139,92,246,0.35)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 40px rgba(76,201,240,0.5)'
              t.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const t = e.target as HTMLElement
              t.style.boxShadow = '0 0 28px rgba(139,92,246,0.35)'
              t.style.transform = 'translateY(0)'
            }}
          >
            Começar Grátis Agora <ArrowRight size={20} />
          </a>
          <p style={{ marginTop: 16, fontSize: 13, color: '#475569' }}>Sem cartão de crédito. Cancele quando quiser.</p>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background: '#000000', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '64px 24px 32px' }}>
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 40,
          marginBottom: 48,
        }}
      >
        {/* Col 1 - Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: GLOW_GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#fff" />
            </div>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontWeight: 800,
                fontSize: 16,
                color: '#fff',
              }}
            >
              Algoritmo Milionário
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#475569', maxWidth: 260 }}>
            A plataforma de inteligência artificial definitiva para infoprodutores criarem, escalarem e venderem mais.
          </p>
        </div>

        {/* Col 2 - Produto */}
        <div>
          <h4
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 16,
            }}
          >
            Produto
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Funcionalidades', 'Preços', 'Integrações', 'Roadmap'].map((item) => (
              <a
                key={item}
                href="#"
                style={{ fontSize: 14, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#475569')}
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Col 3 - Recursos */}
        <div>
          <h4
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 16,
            }}
          >
            Recursos
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Blog', 'Tutoriais', 'Comunidade', 'Suporte'].map((item) => (
              <a
                key={item}
                href="#"
                style={{ fontSize: 14, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#475569')}
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Col 4 - Legal */}
        <div>
          <h4
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 16,
            }}
          >
            Legal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Termos de Uso', 'Privacidade', 'Cookies'].map((item) => (
              <a
                key={item}
                href="#"
                style={{ fontSize: 14, color: '#475569', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#94a3b8')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#475569')}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: '#334155' }}>
          © {new Date().getFullYear()} Algoritmo Milionário. Todos os direitos reservados.
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={14} color="#334155" />
          <span style={{ fontSize: 13, color: '#334155' }}>Brasil</span>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <main
      style={{
        backgroundColor: '#000000',
        minHeight: '100dvh',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        color: '#fff',
        overflowX: 'hidden',
      }}
    >
      <Navbar />
      <Hero />
      <SocialProof />
      <Funcionalidades />
      <ComoFunciona />
      <Demonstracao />
      <Depoimentos />
      <Precos />
      <CtaFinal />
      <Footer />
    </main>
  )
}
