'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ArrowLeft, Check, ChevronLeft, ChevronRight, Calendar, LayoutGrid, CalendarDays, List, X, Save } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanSummary = {
  id: string
  title: string
  product_name: string
  duration_days: number
  start_date: string
  status: 'draft' | 'generating' | 'active' | 'completed' | 'error'
  created_at: string
}

type PlanItem = {
  id: string
  plan_id: string
  day_number: number
  scheduled_date: string
  content_type: 'story' | 'reel' | 'feed' | 'carousel'
  slot_number: number
  title: string
  content: string
  caption: string
  status: 'pending' | 'done' | 'skipped'
}

type PlanFull = PlanSummary & {
  offer_info?: string
  target_audience?: string
  differentials?: string
}

type View = 'list' | 'create' | 'plan'
type PlannerMode = 'month' | 'week' | 'day'

type EditDraft = {
  title: string
  content: string
  caption: string
  status: 'pending' | 'done' | 'skipped'
}

type DayBucket = {
  dayNumber: number
  date: string
  weekNumber: number
  items: PlanItem[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getStatusColor(status: string) {
  if (status === 'active')     return { bg: 'rgba(16,185,129,0.15)',  color: '#10b981', border: 'rgba(16,185,129,0.3)' }
  if (status === 'completed')  return { bg: 'rgba(59,130,246,0.15)',  color: '#3b82f6', border: 'rgba(59,130,246,0.3)' }
  if (status === 'generating') return { bg: 'rgba(99,102,241,0.15)',  color: '#818cf8', border: 'rgba(99,102,241,0.3)' }
  if (status === 'error')      return { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)'  }
  return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
}

function getStatusLabel(status: string) {
  if (status === 'active')     return 'Ativo'
  if (status === 'completed')  return 'Concluído'
  if (status === 'generating') return 'Gerando…'
  if (status === 'error')      return 'Erro'
  return 'Rascunho'
}

function getTypeStyle(type: string) {
  if (type === 'reel') return { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)', label: 'Reel' }
  if (type === 'feed') return { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)', label: 'Feed' }
  if (type === 'carousel') return { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: 'Carrossel' }
  return { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: 'rgba(139,92,246,0.3)', label: 'Story' }
}

function getTypeInitial(type: string) {
  if (type === 'reel') return 'R'
  if (type === 'feed') return 'F'
  if (type === 'carousel') return 'C'
  return 'S'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function summarizeText(text: string, max = 150) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

function summarizeTitle(text: string, max = 60) {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).trimEnd()}…`
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function buildDayBuckets(items: PlanItem[], startDate: string, durationDays: number): DayBucket[] {
  const weekDayOffset = new Date(startDate + 'T00:00:00')
  return Array.from({ length: durationDays }, (_, index) => {
    const dayNumber = index + 1
    const dayDate = new Date(weekDayOffset)
    dayDate.setDate(weekDayOffset.getDate() + index)
    const scheduledDate = dayDate.toISOString().split('T')[0]
    return {
      dayNumber,
      date: scheduledDate,
      weekNumber: Math.floor(index / 7) + 1,
      items: items.filter(item => item.day_number === dayNumber).sort((a, b) => {
        if (a.content_type === 'story' && b.content_type === 'story') return a.slot_number - b.slot_number
        if (a.content_type === 'story') return -1
        if (b.content_type === 'story') return 1
        return a.slot_number - b.slot_number
      }),
    }
  })
}

function PlanItemCard({
  item,
  mode = 'day',
  compact = false,
  monthExpanded = false,
  onOpen,
  onToggleDone,
}: {
  item: PlanItem
  mode?: PlannerMode
  compact?: boolean
  monthExpanded?: boolean
  onOpen: (item: PlanItem) => void
  onToggleDone: (item: PlanItem) => void
}) {
  const typeStyle = getTypeStyle(item.content_type)
  const isDone = item.status === 'done'

  if (mode === 'month') {
    return (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onOpen(item)
        }}
        style={{
          width: '100%',
          textAlign: 'left',
          border: '1px solid rgba(148,163,184,0.10)',
          background: monthExpanded ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.015)',
          borderRadius: 10,
          padding: '7px 10px',
          color: '#e5e7eb',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.45,
          cursor: 'pointer',
          fontFamily: 'inherit',
          opacity: 0.98,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 18,
              height: 18,
              borderRadius: 999,
              background: getTypeStyle(item.content_type).bg,
              color: getTypeStyle(item.content_type).color,
              border: `1px solid ${getTypeStyle(item.content_type).border}`,
              fontSize: 10,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {getTypeInitial(item.content_type)}
          </span>
          <span style={{ lineHeight: 1.3 }}>
            {summarizeTitle(item.title, 64)}
          </span>
        </span>
      </button>
    )
  }

  return (
    <div
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen(item) }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: isDone
          ? 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))'
          : item.content_type === 'story'
          ? 'linear-gradient(180deg, rgba(99,102,241,0.08), rgba(15,23,42,0.72))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(15,23,42,0.7))',
        border: isDone
          ? '1px solid rgba(16,185,129,0.14)'
          : item.content_type === 'carousel'
          ? '1px solid rgba(245,158,11,0.12)'
          : item.content_type === 'reel'
          ? '1px solid rgba(59,130,246,0.12)'
          : '1px solid rgba(148,163,184,0.10)',
        borderRadius: 16,
        padding: compact ? '14px 14px 12px' : '16px 16px 14px',
        cursor: 'pointer',
        transition: 'transform 0.18s ease, border-color 0.18s ease, background 0.18s ease',
        minHeight: compact ? 0 : 170,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = isDone
          ? 'rgba(16,185,129,0.24)'
          : item.content_type === 'carousel'
          ? 'rgba(245,158,11,0.22)'
          : item.content_type === 'reel'
          ? 'rgba(59,130,246,0.22)'
          : 'rgba(255,255,255,0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.3px',
            background: typeStyle.bg,
            color: typeStyle.color,
            border: `1px solid ${typeStyle.border}`,
            flexShrink: 0,
          }}
        >
          {typeStyle.label}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: isDone ? '#6ee7b7' : '#7c8aa0' }}>
          {isDone ? 'Concluído' : item.status === 'skipped' ? 'Ignorado' : 'Pendente'}
        </span>
      </div>

      <div>
        <h4
          style={{
            fontSize: compact ? 13.5 : 15,
            lineHeight: 1.35,
            fontWeight: 700,
          color: '#f8fafc',
          margin: '0 0 6px',
        }}
      >
          {item.title}
        </h4>
        <p
          style={{
            fontSize: compact ? 12 : 12.5,
            lineHeight: 1.6,
            color: '#d6dee9',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: compact ? 2 : 4,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {summarizeText(item.content, compact ? 120 : 220)}
        </p>
      </div>

      {!compact && item.caption && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(148,163,184,0.10)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#7c8aa0', marginBottom: 4 }}>Legenda</div>
          <p style={{ fontSize: 12, lineHeight: 1.55, color: '#dbe4ef', margin: 0, whiteSpace: 'pre-wrap' }}>
            {summarizeText(item.caption, 180)}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleDone(item)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 11px',
            borderRadius: 10,
            border: isDone ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(148,163,184,0.10)',
            background: isDone ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
            color: isDone ? '#6ee7b7' : '#cbd5e1',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Check size={12} />
          {isDone ? 'Feito' : 'Marcar feito'}
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onOpen(item)
          }}
          style={{
            padding: '8px 11px',
            borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.14)',
            background: 'rgba(139,92,246,0.06)',
            color: '#ddd6fe',
            fontSize: 11.5,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Abrir completo
        </button>
      </div>
    </div>
  )
}

function ItemEditorModal({
  item,
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  item: PlanItem | null
  draft: EditDraft | null
  saving: boolean
  onClose: () => void
  onChange: (next: EditDraft) => void
  onSave: () => void
}) {
  if (!item || !draft) return null
  const typeStyle = getTypeStyle(item.content_type)

  return (
    <div
      role="dialog"
      aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(2,6,23,0.56)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(980px, 100%)',
          maxHeight: '92vh',
          overflow: 'auto',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(10,12,24,0.96))',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
          padding: 22,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 800,
                  background: typeStyle.bg,
                  color: typeStyle.color,
                  border: `1px solid ${typeStyle.border}`,
                }}
              >
                {typeStyle.label}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Dia {item.day_number} • {formatFullDate(item.scheduled_date)}
              </span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25 }}>
              Editar conteúdo do plano
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.6 }}>
              Ajuste título, roteiro e legenda. O salvamento atualiza o item sem sair da tela.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Título
              </label>
              <input
                value={draft.title}
                onChange={e => onChange({ ...draft, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Conteúdo
              </label>
              <textarea
                value={draft.content}
                onChange={e => onChange({ ...draft, content: e.target.value })}
                rows={16}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  lineHeight: 1.65,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Legenda
              </label>
              <textarea
                value={draft.caption}
                onChange={e => onChange({ ...draft, caption: e.target.value })}
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  lineHeight: 1.65,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                padding: 16,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.4px' }}>
                Status
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {(['pending', 'done', 'skipped'] as const).map(status => {
                  const active = draft.status === status
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onChange({ ...draft, status })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: active ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.08)',
                        background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                        color: active ? '#e9d5ff' : '#cbd5e1',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {status === 'pending' ? 'Pendente' : status === 'done' ? 'Feito' : 'Ignorado'}
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 10, letterSpacing: '0.4px' }}>
                Visualização rápida
              </div>
              <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {draft.content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #5763ff, #7c5cff)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: saving ? 0.75 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DayBucketCard({
  day,
  mode,
  active,
  expanded = false,
  onSelectDay,
  onOpenItem,
  onToggleDone,
  onToggleExpanded,
}: {
  day: DayBucket
  mode: PlannerMode
  active: boolean
  expanded?: boolean
  onSelectDay: (dayIndex: number) => void
  onOpenItem: (item: PlanItem) => void
  onToggleDone: (item: PlanItem) => void
  onToggleExpanded?: () => void
  }) {
  const previewLimit = mode === 'month' ? (expanded ? 999 : 2) : mode === 'week' ? 4 : 99
  const visibleItems = day.items.slice(0, previewLimit)
  const d = new Date(day.date + 'T00:00:00')
  const weekDay = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')

  return (
    <div
      onClick={() => onSelectDay(day.dayNumber - 1)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectDay(day.dayNumber - 1) }}
      style={{
        background: active
          ? 'linear-gradient(180deg, rgba(99,102,241,0.10), rgba(15,23,42,0.88))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.018), rgba(15,23,42,0.74))',
        border: active
          ? '1px solid rgba(139,92,246,0.20)'
          : '1px solid rgba(148,163,184,0.08)',
        borderRadius: 18,
        padding: 16,
        cursor: 'pointer',
        transition: 'transform 0.18s ease, border-color 0.18s ease',
        minHeight: mode === 'month' ? 240 : mode === 'week' ? 320 : 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = active ? 'rgba(139,92,246,0.36)' : 'rgba(255,255,255,0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dia {day.dayNumber}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
            {formatDate(day.date)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            {weekDay} • semana {day.weekNumber}
          </div>
        </div>
        {mode !== 'month' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              background: 'rgba(139,92,246,0.08)',
              color: '#c4b5fd',
              border: '1px solid rgba(139,92,246,0.12)',
              flexShrink: 0,
            }}
          >
            {day.items.length} item{day.items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleItems.map(item => (
          <PlanItemCard
            key={item.id}
            item={item}
            mode={mode}
            compact={mode !== 'day'}
            onOpen={onOpenItem}
            onToggleDone={onToggleDone}
          />
        ))}
      </div>

      {day.items.length === 0 && (
        <div
          style={{
            padding: '18px 14px',
            borderRadius: 14,
            border: '1px dashed rgba(148,163,184,0.12)',
            color: '#94a3b8',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          Sem itens neste dia.
        </div>
      )}

      {mode === 'month' && day.items.length > 2 && (
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onToggleExpanded?.()
          }}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.10)',
            background: 'rgba(255,255,255,0.015)',
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {expanded ? 'Ver menos' : `Ver mais (${day.items.length - 2})`}
        </button>
      )}
    </div>
  )
}

// ─── Calendar Loader ─────────────────────────────────────────────────────────

function CalendarLoader() {
  return (
    <div style={{
      position: 'relative', width: 320, height: 320,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 10,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
        <defs>
          <linearGradient id="planRing1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="planRing2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="planRing3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4cc9f0" stopOpacity="0" />
            <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4cc9f0" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="3.2s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#planRing1)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5.5" fill="#818cf8">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="12" fill="#6366f1" opacity="0">
            <animate attributeName="opacity" values="0;0.15;0" dur="2s" repeatCount="indefinite" />
            <animate attributeName="r" values="9;14;9" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="65 110 110" to="425 110 110" dur="4.8s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#planRing2)" strokeWidth="1.5" />
          <path d="M202 106 L203.8 109.5 L207.5 110 L203.8 112.5 L202 116 L200.2 112.5 L196.5 110 L200.2 107 Z" fill="#a78bfa">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
          </path>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="-50 110 110" to="310 110 110" dur="6.5s" repeatCount="indefinite" />
          <ellipse cx="110" cy="110" rx="92" ry="28" fill="none" stroke="url(#planRing3)" strokeWidth="1.5" />
          <circle cx="202" cy="110" r="5" fill="none" stroke="#4cc9f0" strokeWidth="1.5">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="202" cy="110" r="2.5" fill="#4cc9f0">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>

        <g>
          <animateTransform attributeName="transform" type="rotate" from="130 110 110" to="490 110 110" dur="5s" repeatCount="indefinite" />
          <circle cx="178" cy="110" r="3.5" fill="#818cf8">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      {/* Spinning ring — NO translate so rotate animation doesn't fight it */}
      <div style={{
        position: 'absolute', width: 74, height: 74, borderRadius: '50%',
        background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #4cc9f0, #818cf8, #6366f1)',
        animation: 'spin 2.4s linear infinite',
        zIndex: 2,
      }} />
      {/* Dark disc + icon — centered by flex parent, no translate needed */}
      <div style={{
        position: 'absolute', width: 68, height: 68, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(10,8,22,0.98), rgba(18,14,34,0.98))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        zIndex: 3,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="planCalGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4cc9f0" />
            </linearGradient>
          </defs>
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#planCalGrad)" strokeWidth="1.8" />
          <path d="M3 9h18" stroke="url(#planCalGrad)" strokeWidth="1.5" />
          <path d="M8 2v4M16 2v4" stroke="url(#planCalGrad)" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="7" y="13" width="3" height="3" rx="0.5" fill="url(#planCalGrad)" opacity="0.8" />
          <rect x="11" y="13" width="3" height="3" rx="0.5" fill="url(#planCalGrad)" opacity="0.55" />
          <rect x="15" y="13" width="3" height="3" rx="0.5" fill="url(#planCalGrad)" opacity="0.3" />
        </svg>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlanejadorPage() {
  const [view, setView] = useState<View>('list')
  const [planMode, setPlanMode] = useState<PlannerMode>('month')
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Selected plan state
  const [selectedPlan, setSelectedPlan] = useState<PlanFull | null>(null)
  const [planItems, setPlanItems] = useState<PlanItem[]>([])
  const [focusedDayIndex, setFocusedDayIndex] = useState(0)
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({})
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [savingItem, setSavingItem] = useState(false)

  // Create form state
  const [form, setForm] = useState({
    title: '',
    productName: '',
    offerInfo: '',
    targetAudience: '',
    differentials: '',
    durationDays: 30 as 15 | 30,
    startDate: new Date().toISOString().split('T')[0],
  })

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? ''
  }, [])

  // Load plans list
  const loadPlans = useCallback(async () => {
    setLoadingList(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/social-planner', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar planos')
      const json = await res.json()
      setPlans(json.plans ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingList(false)
    }
  }, [getToken])

  // Initial list load is intentionally triggered from the client on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPlans() }, [loadPlans])

  // Poll when selected plan is still generating (using 'draft' + no items as signal)
  useEffect(() => {
    const isGenerating = selectedPlan?.status === 'generating' || (selectedPlan?.status === 'draft' && planItems.length === 0)
    if (!isGenerating) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`/api/social-planner/${selectedPlan.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const json = await res.json()
        if (json.plan.status !== 'generating') {
          clearInterval(pollRef.current!)
          pollRef.current = null
          setSelectedPlan(json.plan)
          setPlanItems(json.items ?? [])
          setExpandedDays({})
          loadPlans()
        }
      } catch { /* keep polling */ }
    }, 3000)
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }
  }, [selectedPlan?.id, selectedPlan?.status, planItems.length, getToken, loadPlans])

  // Load single plan
  const loadPlan = useCallback(async (id: string) => {
    setLoadingPlan(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/social-planner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar plano')
      const json = await res.json()
      setSelectedPlan(json.plan)
      setPlanItems(json.items ?? [])
      setExpandedDays({})
      setFocusedDayIndex(0)
      setPlanMode('month')
      setEditingItem(null)
      setEditDraft(null)
      setView('plan')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingPlan(false)
    }
  }, [getToken])

  // Generate plan
  async function handleGenerate() {
    if (!form.title || !form.productName || !form.offerInfo || !form.targetAudience || !form.differentials) {
      setError('Preencha todos os campos obrigatórios')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch('/api/social-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          productName: form.productName,
          offerInfo: form.offerInfo,
          targetAudience: form.targetAudience,
          differentials: form.differentials,
          durationDays: form.durationDays,
          startDate: form.startDate,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Falha ao gerar plano')
      }
      const json = await res.json()
      setGenerating(false)
      await loadPlans()
      await loadPlan(json.plan.id)
    } catch (err) {
      setError((err as Error).message)
      setGenerating(false)
    }
  }

  const planDays = useMemo(() => {
    if (!selectedPlan) return []
    return buildDayBuckets(planItems, selectedPlan.start_date, selectedPlan.duration_days)
  }, [planItems, selectedPlan])

  const focusedDayIndexClamped = clamp(focusedDayIndex, 0, Math.max(0, planDays.length - 1))
  const focusedDay = planDays[focusedDayIndexClamped] ?? null
  const currentWeekStart = Math.floor(focusedDayIndexClamped / 7) * 7
  const currentWeekDays = planDays.slice(currentWeekStart, currentWeekStart + 7)
  const doneCount = planItems.filter(i => i.status === 'done').length
  const totalCount = planItems.length
  const progressPct = planItems.length > 0 ? Math.round((planItems.filter(i => i.status === 'done').length / planItems.length) * 100) : 0

  async function persistItemUpdate(itemId: string, payload: {
    status?: 'pending' | 'done' | 'skipped'
    title?: string
    content?: string
    caption?: string
  }) {
    if (!selectedPlan) throw new Error('Nenhum plano selecionado')
    const token = await getToken()
    const res = await fetch(`/api/social-planner/${selectedPlan.id}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const msg = await res.text()
      throw new Error(msg || 'Falha ao atualizar item')
    }
    const json = await res.json()
    return json.item as PlanItem
  }

  function openItemEditor(item: PlanItem) {
    setEditingItem(item)
    setEditDraft({
      title: item.title,
      content: item.content,
      caption: item.caption,
      status: item.status,
    })
  }

  function closeItemEditor() {
    if (savingItem) return
    setEditingItem(null)
    setEditDraft(null)
  }

  async function saveEditedItem() {
    if (!editingItem || !editDraft) return
    setSavingItem(true)
    try {
      const updated = await persistItemUpdate(editingItem.id, {
        title: editDraft.title,
        content: editDraft.content,
        caption: editDraft.caption,
        status: editDraft.status,
      })
      setPlanItems(prev => prev.map(item => item.id === updated.id ? updated : item))
      setEditingItem(updated)
      setEditDraft({
        title: updated.title,
        content: updated.content,
        caption: updated.caption,
        status: updated.status,
      })
      setEditingItem(null)
      setEditDraft(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSavingItem(false)
    }
  }

  async function handleToggleDone(item: PlanItem) {
    const nextStatus = item.status === 'done' ? 'pending' : 'done'
    try {
      const updated = await persistItemUpdate(item.id, { status: nextStatus })
      setPlanItems(prev => prev.map(row => row.id === updated.id ? updated : row))
      if (editingItem?.id === item.id) {
        setEditingItem(updated)
        setEditDraft({
          title: updated.title,
          content: updated.content,
          caption: updated.caption,
          status: updated.status,
        })
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  function moveFocus(delta: number) {
    if (!planDays.length) return
    setFocusedDayIndex(prev => clamp(prev + delta, 0, planDays.length - 1))
  }

  function toggleMonthExpanded(dayNumber: number) {
    setExpandedDays(prev => ({ ...prev, [dayNumber]: !prev[dayNumber] }))
  }

  // ── RENDER: generating ────────────────────────────────────────────────────

  if (generating) {
    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(ellipse at 30% 40%, rgba(99,102,241,0.14) 0%, transparent 55%),
                       radial-gradient(ellipse at 70% 60%, rgba(139,92,246,0.1) 0%, transparent 55%),
                       #080a16`,
          minHeight: '100dvh', position: 'relative',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 480, padding: '0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CalendarLoader />
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
              fontSize: 26, fontWeight: 800, marginBottom: 10, marginTop: 28,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}
          >
            Criando seu plano...
          </h2>
          <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            Gary Vee e Érico Rocha estão estruturando {form.durationDays} dias de estratégia de conteúdo.
          </p>
          <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', borderRadius: 99,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #4cc9f0)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />
          </div>
          <p style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>Isso pode levar até 60 segundos...</p>
        </div>
      </div>
    )
  }

  // ── RENDER: plan view ─────────────────────────────────────────────────────

  if (view === 'plan' && selectedPlan) {
    // Show generating state while AI is working
    if (selectedPlan.status === 'generating') {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#080a16', minHeight: '100dvh', gap: 24, padding: 40,
        }}>
          <CalendarLoader />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
              Gerando seu plano de {selectedPlan.duration_days} dias…
            </p>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              A IA está criando stories, reels e posts personalizados. Isso leva cerca de 30–60 segundos.
            </p>
          </div>
        </div>
      )
    }

    if (selectedPlan.status === 'error') {
      return (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: '#080a16', minHeight: '100dvh', gap: 16, padding: 40,
        }}>
          <CalendarLoader />
          <div style={{ textAlign: 'center', maxWidth: 520 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fca5a5', marginBottom: 8 }}>
              Não foi possível gerar este plano
            </p>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              O backend marcou o plano como erro. Você pode voltar e tentar gerar novamente com os mesmos dados ou criar um novo plano.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: `radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.08) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.06) 0%, transparent 50%),
                       #080a16`,
          minHeight: '100dvh',
          overflow: 'auto',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />

        <div style={{ position: 'relative', zIndex: 1, padding: 'clamp(16px, 4vw, 28px)', maxWidth: 1540, width: '100%', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setView('list'); setSelectedPlan(null); setPlanItems([]) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '9px 14px', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.18s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8' }}
              >
                <ArrowLeft size={14} /> Voltar
              </button>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {selectedPlan.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{selectedPlan.product_name}</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#334155' }} />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    Início: {selectedPlan.start_date ? formatDate(selectedPlan.start_date) : '—'}
                  </span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#334155' }} />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{selectedPlan.duration_days} dias</span>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#334155' }} />
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{planDays.length} dias organizados</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 6 }}>
                  {doneCount}/{totalCount} concluídos
                </div>
                <div style={{ width: 180, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: 99, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{progressPct}% completo</div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: 12,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              <div className="toolbar-rail" style={{ gap: 8, padding: 4, borderRadius: 14, background: 'rgba(15,23,42,0.42)', border: '1px solid rgba(148,163,184,0.08)' }}>
                {([
                  { id: 'month', label: 'Mês', icon: <LayoutGrid size={14} /> },
                  { id: 'week', label: 'Semana', icon: <CalendarDays size={14} /> },
                  { id: 'day', label: 'Dia', icon: <List size={14} /> },
                ] as const).map(tab => {
                  const active = planMode === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPlanMode(tab.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 13px',
                        borderRadius: 12,
                        border: active ? '1px solid rgba(139,92,246,0.24)' : '1px solid transparent',
                        background: active ? 'rgba(139,92,246,0.08)' : 'transparent',
                        color: active ? '#e9d5ff' : '#94a3b8',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  disabled={planMode === 'month'}
                  onClick={() => moveFocus(planMode === 'week' ? -7 : -1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: planMode === 'month' ? '#475569' : '#cbd5e1',
                    cursor: planMode === 'month' ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <ChevronLeft size={15} />
                  {planMode === 'week' ? 'Semana anterior' : 'Dia anterior'}
                </button>
                <div style={{ minWidth: 160, textAlign: 'center', padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(148,163,184,0.08)', color: '#e2e8f0', fontSize: 13, fontWeight: 700 }}>
                  {planMode === 'month' && 'Visão geral'}
                  {planMode === 'week' && `Semana ${Math.floor(focusedDayIndexClamped / 7) + 1}`}
                  {planMode === 'day' && focusedDay ? `Dia ${focusedDay.dayNumber}` : ''}
                </div>
                <button
                  type="button"
                  disabled={planMode === 'month'}
                  onClick={() => moveFocus(planMode === 'week' ? 7 : 1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: planMode === 'month' ? '#475569' : '#cbd5e1',
                    cursor: planMode === 'month' ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {planMode === 'week' ? 'Próxima semana' : 'Próximo dia'}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {planMode === 'month' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
                {planDays.map(day => (
                  <DayBucketCard
                    key={day.dayNumber}
                    day={day}
                    mode="month"
                    active={focusedDayIndexClamped === day.dayNumber - 1}
                    expanded={!!expandedDays[day.dayNumber]}
                    onToggleExpanded={() => toggleMonthExpanded(day.dayNumber)}
                    onSelectDay={index => { setFocusedDayIndex(index); setPlanMode('day') }}
                    onOpenItem={openItemEditor}
                    onToggleDone={handleToggleDone}
                  />
                ))}
              </div>
            )}

            {planMode === 'week' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {currentWeekDays.map(day => (
                  <DayBucketCard
                    key={day.dayNumber}
                    day={day}
                    mode="week"
                    active={focusedDayIndexClamped === day.dayNumber - 1}
                    onSelectDay={index => { setFocusedDayIndex(index); setPlanMode('day') }}
                    onOpenItem={openItemEditor}
                    onToggleDone={handleToggleDone}
                  />
                ))}
              </div>
            )}

            {planMode === 'day' && focusedDay && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr)',
                  gap: 16,
                }}
              >
                <DayBucketCard
                  key={focusedDay.dayNumber}
                  day={focusedDay}
                  mode="day"
                  active
                  onSelectDay={() => {}}
                  onOpenItem={openItemEditor}
                  onToggleDone={handleToggleDone}
                />
              </div>
            )}
          </div>
        </div>

        <ItemEditorModal
          item={editingItem}
          draft={editDraft}
          saving={savingItem}
          onClose={closeItemEditor}
          onChange={setEditDraft}
          onSave={saveEditedItem}
        />
      </div>
    )
  }

  // ── RENDER: create form ───────────────────────────────────────────────────

  if (view === 'create') {
    const inputStyle: React.CSSProperties = {
      width: '100%', padding: '11px 14px',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none',
      fontFamily: 'inherit', transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }
    const labelStyle: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'block' }

    return (
      <div
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: `radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.08) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.06) 0%, transparent 50%),
                       #080a16`,
          overflow: 'auto',
        }}
      >
        <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '28px', maxWidth: 700, width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <button
              onClick={() => { setView('list'); setError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 9, padding: '7px 13px', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8' }}
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <div>
              <h1
                style={{
                  fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                  fontSize: 22, fontWeight: 800, color: '#fff', margin: 0,
                }}
              >
                Novo Plano de Conteúdo
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>
                Preencha os dados para gerar seu plano com IA
              </p>
            </div>
          </div>

          {/* Form */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16, padding: '28px',
            }}
          >
            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Título */}
              <div>
                <label style={labelStyle}>Título do plano *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Lançamento Curso Tráfego Pago — Abril"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Produto */}
              <div>
                <label style={labelStyle}>Nome do produto *</label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                  placeholder="Ex: Método Tráfego Algoritmo Milionário"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Oferta */}
              <div>
                <label style={labelStyle}>Informações da oferta *</label>
                <textarea
                  value={form.offerInfo}
                  onChange={e => setForm(f => ({ ...f, offerInfo: e.target.value }))}
                  placeholder="Descreva o que está sendo ofertado, preço, bônus, garantia..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Público */}
              <div>
                <label style={labelStyle}>Público-alvo *</label>
                <textarea
                  value={form.targetAudience}
                  onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value }))}
                  placeholder="Quem é o seu cliente ideal? Descreva dores, desejos e nível de consciência..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Diferenciais */}
              <div>
                <label style={labelStyle}>Diferenciais *</label>
                <textarea
                  value={form.differentials}
                  onChange={e => setForm(f => ({ ...f, differentials: e.target.value }))}
                  placeholder="O que torna este produto único? Por que comprar de você?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>

              {/* Duração + Data */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Duração *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([15, 30] as (15 | 30)[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setForm(f => ({ ...f, durationDays: d }))}
                        style={{
                          flex: 1, padding: '10px', borderRadius: 9,
                          background: form.durationDays === d
                            ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                          border: form.durationDays === d
                            ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          color: form.durationDays === d ? '#a78bfa' : '#94a3b8',
                          fontSize: 14, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.18s ease',
                        }}
                      >
                        {d} dias
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Data de início *</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.08)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleGenerate}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', borderRadius: 11,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 24px rgba(99,102,241,0.35)',
                  transition: 'all 0.18s ease',
                  marginTop: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 32px rgba(99,102,241,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(99,102,241,0.35)'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Gerar Plano com IA
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: list view ─────────────────────────────────────────────────────

  return (
    <div
      style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: `radial-gradient(ellipse at 20% 20%, rgba(139,92,246,0.08) 0%, transparent 50%),
                     radial-gradient(ellipse at 80% 80%, rgba(59,130,246,0.06) 0%, transparent 50%),
                     #080a16`,
        overflow: 'auto',
      }}
    >
      <div className="aurora-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.5 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '28px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
                fontSize: 28, fontWeight: 800, color: '#fff', margin: 0,
                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >
              Planejador Social
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              Planos de conteúdo gerados por IA, estratégia Gary Vee + Érico Rocha
            </p>
          </div>
          <button
            onClick={() => { setView('create'); setError(null) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 11,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <Plus size={16} /> Novo Plano
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Loading */}
        {loadingList && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Plans grid */}
        {!loadingList && plans.length === 0 && (
          <div
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '80px 0', textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 60, height: 60, borderRadius: 16,
                background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}
            >
              <Calendar size={28} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
              Nenhum plano criado ainda
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              Crie seu primeiro plano de conteúdo para as redes sociais
            </p>
            <button
              onClick={() => setView('create')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
                color: '#a78bfa', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Plus size={15} /> Criar primeiro plano
            </button>
          </div>
        )}

        {!loadingList && plans.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {plans.map(plan => {
              const statusStyle = getStatusColor(plan.status)
              return (
                <div
                  key={plan.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '20px',
                    transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.25)'
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Plan title + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.35, flex: 1 }}>
                      {plan.title}
                    </h3>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 9px', borderRadius: 99,
                        fontSize: 10.5, fontWeight: 700, flexShrink: 0,
                        background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {getStatusLabel(plan.status)}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{plan.product_name}</p>

                  {/* Meta info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '3px 9px', borderRadius: 99,
                        fontSize: 11, fontWeight: 600,
                        background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)',
                      }}
                    >
                      {plan.duration_days} dias
                    </span>
                    {plan.start_date && (
                      <span style={{ fontSize: 12, color: '#475569' }}>
                        Início: {formatDate(plan.start_date)}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => loadPlan(plan.id)}
                    disabled={loadingPlan}
                    style={{
                      width: '100%', padding: '9px',
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: 9, color: '#a78bfa', fontSize: 13, fontWeight: 600,
                      cursor: loadingPlan ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.18s ease',
                      opacity: loadingPlan ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!loadingPlan) { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)' } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)' }}
                  >
                    Ver Plano
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
