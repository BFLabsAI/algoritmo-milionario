'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function FadeInUp({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.unobserve(entry.target)
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

type ServiceCardData = {
  href: string
  label: string
  desc: string
  img?: string
  placeholderIcon?: string
  placeholderBg?: string
  accent: string
  btn: string
}

const CHAT_CARD: ServiceCardData = {
  href: '/dashboard/chat',
  label: 'Chat — Algoritmo Milionário',
  desc: 'Chat multi-modelo com GPT-4, Claude, Gemini e mais',
  img: '/stitch/chat-scaleia.webp',
  accent: 'linear-gradient(135deg, #0f1729 0%, #1a2550 100%)',
  btn: 'linear-gradient(135deg, #4cc9f0, #3a86ff)',
}

const ESTRATEGIA_CARDS: ServiceCardData[] = [
  {
    href: '/dashboard/planejador',
    label: 'Planejador Social',
    desc: 'Planos de 15 ou 30 dias com estratégia completa',
    img: '/stitch/planejar-conteudos.webp',
    accent: 'linear-gradient(135deg, #0e0a1f 0%, #1a1035 100%)',
    btn: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
  {
    href: '/dashboard/criador-produto',
    label: 'Criador de Produto',
    desc: 'Estruture cursos e infoprodutos com a metodologia Hormozi',
    img: '/stitch/criar-produto.webp',
    accent: 'linear-gradient(135deg, #0a0e1f 0%, #0d1435 100%)',
    btn: 'linear-gradient(135deg, #22c55e, #16a34a)',
  },
  {
    href: '/dashboard/analisador',
    label: 'Analista de Ofertas',
    desc: 'Avalie copy e páginas de vendas com score cirúrgico',
    img: '/stitch/analisar-oferta.webp',
    accent: 'linear-gradient(135deg, #080e1f 0%, #0a1235 100%)',
    btn: 'linear-gradient(135deg, #f87171, #dc2626)',
  },
]

const GERACAO_CARDS: ServiceCardData[] = [
  {
    href: '/dashboard/imagens',
    label: 'Gerador de Imagens',
    desc: 'Crie assets visuais e criativos com IA',
    img: '/stitch/gerar-criativos.webp',
    accent: 'linear-gradient(135deg, #1a0f2e 0%, #3b1f64 100%)',
    btn: 'linear-gradient(135deg, #f472b6, #db2777)',
  },
  {
    href: '/dashboard/ebooks',
    label: 'Criador de Ebook',
    desc: 'Gere ebooks completos com formatação profissional',
    img: '/stitch/gerar-ebooks.webp',
    accent: 'linear-gradient(135deg, #0c261a 0%, #0d492d 100%)',
    btn: 'linear-gradient(135deg, #34d399, #059669)',
  },
]

const FERRAMENTAS_CARDS: ServiceCardData[] = [
  {
    href: '/dashboard/prompts',
    label: 'Prompts Estratégicos',
    desc: 'Biblioteca de prompts profissionais por categoria',
    img: '/stitch/biblioteca-de-prompts.webp',
    accent: 'linear-gradient(135deg, #160d2e 0%, #3b0764 100%)',
    btn: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  {
    href: '/dashboard/agentes',
    label: 'Agentes Experts',
    desc: 'Especialistas em marketing digital e vendas',
    img: '/stitch/agentes-experts.webp',
    accent: 'linear-gradient(135deg, #0c1a26 0%, #0d3349 100%)',
    btn: 'linear-gradient(135deg, #4cc9f0, #0891b2)',
  },
]

function CardImageArea({ card }: { card: ServiceCardData }) {
  if (card.img) {
    return (
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={card.img}
          alt={card.label}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
          background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
        }} />
      </div>
    )
  }

  return (
    <div style={{
      height: 220,
      background: card.placeholderBg ?? card.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.07) 0%, transparent 70%)',
      }} />
      <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.5))', zIndex: 1 }}>
        {card.placeholderIcon ?? '✦'}
      </span>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.4))',
      }} />
    </div>
  )
}

const GLASS_CARD = 'rgba(8, 12, 42, 0.82)'
const GLASS_BORDER = '1px solid rgba(80, 110, 255, 0.2)'
const GLASS_FOOTER = 'linear-gradient(135deg, rgba(10, 18, 58, 0.97) 0%, rgba(28, 10, 58, 0.97) 100%)'
const GLASS_BTN = 'linear-gradient(135deg, #3d6ef5 0%, #7c3aed 100%)'
const GLASS_SHADOW = '0 4px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)'
const GLASS_SHADOW_HOVER = '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(100,130,255,0.25)'

function ServiceCard({ card }: { card: ServiceCardData }) {
  return (
    <Link href={card.href} style={{ textDecoration: 'none', color: '#fff', display: 'block', height: '100%' }}>
      <div
        style={{
          borderRadius: 22,
          background: GLASS_CARD,
          overflow: 'hidden',
          cursor: 'pointer',
          border: GLASS_BORDER,
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          boxShadow: GLASS_SHADOW,
          height: '100%',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-5px) scale(1.01)'
          el.style.boxShadow = GLASS_SHADOW_HOVER
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0) scale(1)'
          el.style.boxShadow = GLASS_SHADOW
        }}
      >
        <CardImageArea card={card} />
        <div style={{
          padding: '16px 18px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          background: GLASS_FOOTER,
          borderTop: '1px solid rgba(80, 110, 255, 0.12)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', wordBreak: 'break-word' }}>
              {card.label}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(180, 190, 255, 0.55)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
              {card.desc}
            </div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: GLASS_BTN,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(100, 80, 220, 0.45)',
          }}>
            <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function SectionTitle({ children, delay }: { children: React.ReactNode, delay: number }) {
  return (
    <FadeInUp delay={delay}>
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', color: 'rgba(255,255,255,0.9)' }}>
        {children}
      </h2>
    </FadeInUp>
  )
}

export default function DashboardHero() {
  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: '#000000',
      color: '#fff',
      fontFamily: "'Space Grotesk','Inter',sans-serif",
      overflowX: 'hidden',
    }}>

      {/* ── HERO ── */}
      <div style={{ position: 'relative', width: '100%' }}>
        <img
          src="/stitch/banner-dashboard.webp"
          alt="Algoritmo Milionário"
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
        />
        <div style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, cursor: 'pointer',
        }}>
          👤
        </div>
      </div>

      {/* ── CONTEÚDO ── */}
      <div className="responsive-shell" style={{ maxWidth: 1200, margin: '0 auto' }}>

        <FadeInUp delay={0}>
          <h1 style={{ fontSize: 'var(--fs-h1)', fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>
            Olá, bem-vindo ao Algoritmo Milionário.
          </h1>
        </FadeInUp>

        {/* Chat */}
        <FadeInUp delay={100}>
          <div style={{ marginBottom: 40 }}>
            <ServiceCard card={CHAT_CARD} />
          </div>
        </FadeInUp>

        {/* Geração com IA */}
        <SectionTitle delay={150}>Geração com IA</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 40,
        }}>
          {GERACAO_CARDS.map((card, idx) => (
            <FadeInUp key={card.href} delay={200 + idx * 80}>
              <ServiceCard card={card} />
            </FadeInUp>
          ))}
        </div>

        {/* Ferramentas */}
        <SectionTitle delay={350}>Ferramentas</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 40,
        }}>
          {FERRAMENTAS_CARDS.map((card, idx) => (
            <FadeInUp key={card.href} delay={400 + idx * 80}>
              <ServiceCard card={card} />
            </FadeInUp>
          ))}
        </div>

        {/* Estratégia & Marketing */}
        <SectionTitle delay={550}>Estratégia & Marketing</SectionTitle>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 40,
        }}>
          {ESTRATEGIA_CARDS.map((card, idx) => (
            <FadeInUp key={card.href} delay={600 + idx * 80}>
              <ServiceCard card={card} />
            </FadeInUp>
          ))}
        </div>

      </div>
    </div>
  )
}
