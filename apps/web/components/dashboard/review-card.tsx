'use client'

import { useState, useTransition } from 'react'
import type { ReviewItem } from '@prisma/client'
import { approveReview, rejectReview, correctReview } from '@/app/(dashboard)/review-queue/actions'

const AGENT_TAG: Record<string, { bg: string; color: string; border: string }> = {
  DEPOSIT:      { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.18)'   },
  WITHDRAWAL:   { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.18)'  },
  VERIFICATION: { bg: 'rgba(168,85,247,0.1)',  color: '#c084fc', border: 'rgba(168,85,247,0.18)'  },
  ONBOARDING:   { bg: 'rgba(59,130,246,0.1)',  color: '#60a5fa', border: 'rgba(59,130,246,0.18)'  },
  GENERAL:      { bg: 'rgba(100,100,120,0.15)', color: '#9ca3af', border: 'rgba(100,100,120,0.2)' },
}

function scoreColor(score: number) {
  if (score >= 0.8) return '#22c55e'
  if (score >= 0.6) return '#f59e0b'
  return '#ef4444'
}

export function ReviewCard({ item }: { item: ReviewItem }) {
  const [correcting, setCorrecting] = useState(false)
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const tag = AGENT_TAG[item.agentType] ?? AGENT_TAG.GENERAL

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: '#0f0f18',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="font-mono uppercase text-[8px] px-1.5 py-0.5 rounded"
            style={{ background: tag.bg, border: `1px solid ${tag.border}`, color: tag.color }}
          >
            {item.agentType}
          </span>
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#f87171',
            }}
          >
            {item.auditReason}
          </span>
        </div>
        <span
          className="font-mono font-semibold tabular-nums text-sm shrink-0"
          style={{ color: scoreColor(item.auditScore) }}
        >
          {item.auditScore.toFixed(2)}
        </span>
      </div>

      {/* Query */}
      <p className="text-[11px] mb-1" style={{ color: '#606075' }}>Query</p>
      <p
        className="text-xs mb-3 p-2 rounded"
        style={{
          background: '#141420',
          color: '#e8e8f0',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {item.queryText}
      </p>

      {/* Response */}
      <p className="text-[11px] mb-1" style={{ color: '#606075' }}>AI Response</p>
      <p
        className="text-xs mb-4 p-2 rounded"
        style={{
          background: '#141420',
          color: '#e8e8f0',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {item.responseText}
      </p>

      {/* Correction textarea */}
      {correcting && (
        <div className="mb-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Enter corrected response…"
            className="w-full text-xs p-2 rounded resize-y font-body"
            style={{
              background: '#141420',
              border: '1px solid rgba(79,70,229,0.3)',
              color: '#e8e8f0',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => startTransition(() => approveReview(item.id))}
          className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors duration-100"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e',
          }}
        >
          Approve
        </button>
        {!correcting ? (
          <button
            onClick={() => setCorrecting(true)}
            className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors duration-100"
            style={{
              background: 'rgba(79,70,229,0.08)',
              border: '1px solid rgba(79,70,229,0.2)',
              color: '#a5a0ff',
            }}
          >
            Correct
          </button>
        ) : (
          <button
            disabled={pending || !text.trim()}
            onClick={() => startTransition(() => correctReview(item.id, text))}
            className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors duration-100"
            style={{
              background: 'rgba(79,70,229,0.12)',
              border: '1px solid rgba(79,70,229,0.25)',
              color: '#a5a0ff',
            }}
          >
            Save Correction
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => startTransition(() => rejectReview(item.id))}
          className="px-3 py-1.5 rounded text-[11px] font-medium transition-colors duration-100"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}
