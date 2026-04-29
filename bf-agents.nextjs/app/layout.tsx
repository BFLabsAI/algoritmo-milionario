// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Algoritmo Milionário — Hub de IA para Infoprodutores',
  description: 'Plataforma de inteligência artificial para criação de infoprodutos, copywriting e marketing digital. Chat multi-modelo, geração de imagens, ebooks e experts especializados.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
