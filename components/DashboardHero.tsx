'use client'
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// Componente para animar a entrada dos elementos ao fazer scroll
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

const CHAT_CARD = {
  href: '/dashboard/chat',
  label: 'Chat - Algoritmo Milionário',
  desc: 'Nosso chat all-in-one',
  img: '/stitch/card_chat.png',
  accent: 'linear-gradient(135deg, #0f1729 0%, #1a2550 100%)',
  btn: 'linear-gradient(135deg, #4cc9f0, #3a86ff)',
}

const GERADORES_CARDS = [
  {
    href: '/dashboard/imagens',
    label: 'Image Generate',
    desc: 'Crie imagens com IA',
    img: '/stitch/card_image_gen.png',
    accent: 'linear-gradient(135deg, #1a0f2e 0%, #3b1f64 100%)',
    btn: 'linear-gradient(135deg, #f472b6, #db2777)',
  },
  {
    href: '/dashboard/ebooks',
    label: 'Criar Ebook',
    desc: 'Geração de materiais ricos',
    img: '/stitch/card_ebook.png',
    accent: 'linear-gradient(135deg, #0c261a 0%, #0d492d 100%)',
    btn: 'linear-gradient(135deg, #34d399, #059669)',
  },
]

const IA_CARDS = [
  {
    href: '/dashboard/prompts',
    label: 'Prompts Estratégicos',
    desc: 'Biblioteca de prompts profissionais',
    img: '/stitch/card_prompts.png',
    accent: 'linear-gradient(135deg, #160d2e 0%, #3b0764 100%)',
    btn: 'linear-gradient(135deg, #a855f7, #7c3aed)',
  },
  {
    href: '/dashboard/experts',
    label: 'Agentes Experts',
    desc: 'Experts para marketing & vendas',
    img: '/stitch/card_experts.png',
    accent: 'linear-gradient(135deg, #0c1a26 0%, #0d3349 100%)',
    btn: 'linear-gradient(135deg, #4cc9f0, #0891b2)',
  },
]

type ServiceCardData = {
  href: string
  label: string
  desc: string
  img: string
  accent: string
  btn: string
}

// Componente Card reutilizável
function ServiceCard({ card }: { card: ServiceCardData }) {
  return (
    <Link href={card.href} style={{ textDecoration: 'none', color: '#fff', display: 'block' }}>
      <div
        style={{
          borderRadius: 22,
          background: card.accent,
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.07)',
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          height: '100%',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(-5px) scale(1.01)'
          el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.65)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.transform = 'translateY(0) scale(1)'
          el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
          <img
            src={card.img}
            alt={card.label}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.5))',
          }} />
        </div>
        <div style={{
          padding: '16px 18px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {card.label}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {card.desc}
            </div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: card.btn,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <ArrowRight size={17} color="#fff" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
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
      <div style={{
        position: 'relative',
        width: '100%',
        height: '42vh',
        minHeight: 280,
        overflow: 'hidden',
      }}>
        {/* Ajustado objectPosition para center para mostrar os robôs e reduzido o gradiente escuro */}
        <img
          src="/stitch/agents-bg-hd.jpg"
          alt="Algoritmo Milionário AI Agents"
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            userSelect: 'none', pointerEvents: 'none',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          paddingBottom: 24,
          background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(0,0,0,0.9) 95%, #000000 100%)',
        }}>
          <span style={{
            fontSize: 36, fontWeight: 900, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 2px 40px rgba(76,201,240,0.35), 0 0 80px rgba(76,201,240,0.15)',
            textTransform: 'uppercase', textAlign: 'center',
          }}>
            Algoritmo Milionário
          </span>
        </div>
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

      {/* ── CONTEÚDO SCROLL (Com Animações FadeInUp) ── */}
      <div style={{ padding: '24px 32px 64px', maxWidth: 1200, margin: '0 auto' }}>
        
        {/* Welcome */}
        <FadeInUp delay={0}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 24px', color: '#fff' }}>
            Olá, bem-vindo ao Algoritmo Milionário.
          </h1>
        </FadeInUp>

        {/* Bloco 1: Chat */}
        <FadeInUp delay={100}>
          <div style={{ marginBottom: 40 }}>
            <ServiceCard card={CHAT_CARD} />
          </div>
        </FadeInUp>

        {/* Bloco 2: Geradores */}
        <FadeInUp delay={200}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', color: 'rgba(255,255,255,0.9)' }}>
            Geradores de Imagens
          </h2>
        </FadeInUp>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 40,
        }}>
          {GERADORES_CARDS.map((card, idx) => (
            <FadeInUp key={card.href} delay={300 + (idx * 100)}>
              <ServiceCard card={card} />
            </FadeInUp>
          ))}
        </div>

        {/* Bloco 3: IA */}
        <FadeInUp delay={400}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', color: 'rgba(255,255,255,0.9)' }}>
            IA
          </h2>
        </FadeInUp>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 18,
          marginBottom: 40,
        }}>
          {IA_CARDS.map((card, idx) => (
            <FadeInUp key={card.href} delay={500 + (idx * 100)}>
              <ServiceCard card={card} />
            </FadeInUp>
          ))}
        </div>

      </div>

    </div>
  )
}
