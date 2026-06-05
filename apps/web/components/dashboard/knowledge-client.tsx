'use client'

import { useState, useTransition, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { addKnowledgeChunk, deleteKnowledgeChunk } from '@/app/(dashboard)/knowledge/actions'

const SOURCES = ['faq', 'policy', 'escalation_guide', 'resolved_case'] as const
const AGENT_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'VERIFICATION', 'ONBOARDING', 'GENERAL', 'ALL'] as const

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>{children}</p>
  )
}

export function AddKnowledgeDialog() {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState<string>('faq')
  const [agentType, setAgentType] = useState<string>('ALL')
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('source', source)
    fd.set('agentType', agentType)
    startTransition(async () => {
      await addKnowledgeChunk(fd)
      formRef.current?.reset()
      setSource('faq')
      setAgentType('ALL')
      setOpen(false)
    })
  }

  const inputStyle = {
    background: '#0a0a14',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e8e8f0',
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'var(--font-mono)',
    width: '100%',
    outline: 'none',
    padding: '8px 10px',
  }

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
        style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
      >
        Add Knowledge
      </DialogTrigger>
      <DialogContent
        className="max-w-lg"
        style={{ background: '#111119', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0' }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0', fontSize: 14 }}>
            Add Knowledge Chunk
          </DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <FieldLabel>Content</FieldLabel>
            <textarea
              name="content"
              required
              rows={5}
              placeholder="Paste FAQ answer, policy excerpt, or escalation guide…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Source</FieldLabel>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                style={selectStyle}
              >
                {SOURCES.map(s => (
                  <option key={s} value={s} style={{ background: '#0a0a14' }}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Agent Type</FieldLabel>
              <select
                value={agentType}
                onChange={e => setAgentType(e.target.value)}
                style={selectStyle}
              >
                {AGENT_TYPES.map(a => (
                  <option key={a} value={a} style={{ background: '#0a0a14' }}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] px-4 py-2 rounded-md"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="font-mono text-[11px] px-4 py-2 rounded-md"
              style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DeleteChunkButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => deleteKnowledgeChunk(id))}
      disabled={pending}
      className="font-mono text-[10px] px-2 py-1 rounded transition-colors"
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.15)',
        color: pending ? '#606075' : '#f87171',
      }}
    >
      {pending ? '…' : 'Del'}
    </button>
  )
}
