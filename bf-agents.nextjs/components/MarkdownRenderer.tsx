'use client'
import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowUpRight } from 'lucide-react'

function preprocessLinks(content: string): string {
  content = content.replace(/\*\*(.+?)\*\*\s*\(\[([^\]]+)\]\)/g, '[**$1**]($2)')
  content = content.replace(/\*\*\[(.+?)\]\((.+?)\)\*\*/g, '[$1]($2)')
  content = content.replace(/\[([^\]]+)\]\s+\(([^)]+)\)/g, '[$1]($2)')
  return content
}

const components: any = {
  h1: ({ children }: any) => <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '20px 0 10px', letterSpacing: '-0.02em' }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '16px 0 8px' }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontSize: 15, fontWeight: 600, color: '#cbd5e1', margin: '12px 0 6px' }}>{children}</h3>,
  h4: ({ children }: any) => <h4 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', margin: '10px 0 4px' }}>{children}</h4>,
  p: ({ children }: any) => <p style={{ fontSize: 15, lineHeight: 1.75, color: '#e2e8f0', margin: '8px 0' }}>{children}</p>,
  a: ({ href, children }: any) => {
    if (href?.startsWith('https://')) return <a href={href} target='_blank' rel='noopener noreferrer' style={{ color: '#60a5fa', textDecoration: 'underline' }}>{children}</a>
    return <a href={href} style={{ color: '#93c5fd' }}>{children}</a>
  },
  ul: ({ children }: any) => <ul style={{ margin: '8px 0', paddingLeft: 0, listStyle: 'none' }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '8px 0', paddingLeft: 20, color: '#e2e8f0', fontSize: 15, lineHeight: 1.75 }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 8 }} /><span style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 1.75 }}>{children}</span></li>,
  blockquote: ({ children }: any) => <blockquote style={{ borderLeft: '3px solid #0ea5e9', paddingLeft: 16, margin: '12px 0', color: '#94a3b8', fontStyle: 'italic' }}>{children}</blockquote>,
  code: ({ className, children }: any) => {
    const isBlock = /language-/.test(className ?? '')
    if (isBlock) return <div style={{ margin: '12px 0', borderRadius: 10, overflow: 'hidden', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}><pre style={{ padding: 16, overflowX: 'auto', margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e2e8f0' }}><code>{children}</code></pre></div>
    return <code style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 6px', fontSize: 13, color: '#f472b6', fontFamily: 'monospace' }}>{children}</code>
  },
  table: ({ children }: any) => <div style={{ overflowX: 'auto', margin: '12px 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>{children}</table></div>,
  thead: ({ children }: any) => <thead style={{ background: 'rgba(255,255,255,0.05)' }}>{children}</thead>,
  th: ({ children }: any) => <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{children}</th>,
  td: ({ children }: any) => <td style={{ padding: '8px 12px', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{children}</td>,
}

function MarkdownRendererBase({ content }: { content: string }) {
  const processed = useMemo(() => preprocessLinks(content), [content])
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{processed}</ReactMarkdown>
}

export const MarkdownRenderer = React.memo(MarkdownRendererBase)
