'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ClearCacheButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleClear() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/cache/clear', { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      setError(err.error ?? 'Failed to clear cache')
      return
    }
    const data = await res.json()
    setSuccess(`Cleared ${data.count ?? 0} vector entries`)
    setDone(true)
    setTimeout(() => { setOpen(false); setDone(false); setSuccess(null) }, 1200)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="font-mono text-[10px] px-3 py-1.5 rounded-md transition-colors"
        style={{
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171',
        }}
      >
        Clear all cache
      </DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{ background: '#111119', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0' }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', color: '#f87171', fontSize: 14 }}>
            Clear all cache?
          </DialogTitle>
        </DialogHeader>
        <p className="text-[12px] mt-1 mb-4" style={{ color: '#606075' }}>
          All cached query responses will be removed. Next queries will hit inference directly until the cache rebuilds.
        </p>
        {error && (
          <p className="font-mono text-[10px] mb-2" style={{ color: '#f87171' }}>{error}</p>
        )}
        {success && (
          <p className="font-mono text-[10px] mb-2" style={{ color: '#22c55e' }}>{success}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setOpen(false); setError(null); setSuccess(null) }}
            className="font-mono text-[11px] px-4 py-2 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
          >
            Cancel
          </button>
          <button
            onClick={handleClear}
            disabled={loading || done}
            className="font-mono text-[11px] px-4 py-2 rounded-md"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: done ? '#22c55e' : '#f87171',
            }}
          >
            {done ? 'Cleared' : loading ? 'Clearing…' : 'Clear all'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SimilarityThresholdCard({ initial }: { initial: number }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initial)
  const [input, setInput] = useState(String(initial))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const n = parseFloat(input)
    if (isNaN(n) || n < 0.5 || n > 1.0) {
      setError('Must be 0.50 – 1.00')
      return
    }
    setSaving(true)
    setError(null)
    const res = await fetch('/api/cache/threshold', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: n }),
    })
    if (res.ok) {
      setValue(n)
      setEditing(false)
    } else {
      setError('Save failed')
    }
    setSaving(false)
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="font-mono uppercase text-[10px] mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
        Similarity Threshold
      </p>
      <p
        className="font-mono font-semibold tabular-nums mb-1"
        style={{ fontSize: 28, color: '#e8e8f0', letterSpacing: '-0.04em', lineHeight: 1 }}
      >
        {value.toFixed(2)}
      </p>
      <p className="text-[11px] mb-3" style={{ color: '#606075' }}>
        Queries above this score return from cache without hitting inference.
      </p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            step="0.01"
            min="0.50"
            max="1.00"
            className="font-mono text-[12px] rounded-md px-3 py-1.5 outline-none w-24"
            style={{ background: '#080810', border: '1px solid rgba(255,255,255,0.1)', color: '#e8e8f0' }}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-mono text-[10px] px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', color: '#a5a0ff' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setEditing(false); setInput(String(value)); setError(null) }}
            className="font-mono text-[10px] px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
          >
            Cancel
          </button>
          {error && <span className="font-mono text-[10px]" style={{ color: '#f87171' }}>{error}</span>}
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="font-mono text-[10px] px-3 py-1.5 rounded-md"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
        >
          Edit
        </button>
      )}
    </div>
  )
}
