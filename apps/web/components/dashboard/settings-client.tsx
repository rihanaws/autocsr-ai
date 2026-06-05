'use client'

import { useState, useTransition } from 'react'
import { rotateApiKey, deleteQueryHistory } from '@/app/(dashboard)/settings/actions'

export function ApiKeySection({ apiKey }: { apiKey: string }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  function copy() {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function rotate() {
    startTransition(async () => {
      await rotateApiKey()
      window.location.reload()
    })
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          readOnly
          value={visible ? apiKey : '•'.repeat(32)}
          onPaste={e => e.preventDefault()}
          className="flex-1 font-mono text-[11px] rounded-md px-3 py-2 outline-none"
          style={{
            background: '#080810',
            border: '1px solid rgba(255,255,255,0.06)',
            color: visible ? '#e8e8f0' : '#606075',
            letterSpacing: visible ? 'normal' : '0.1em',
          }}
        />
        <button
          onClick={() => setVisible(v => !v)}
          className="font-mono text-[10px] px-3 py-2 rounded-md transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={copy}
          className="font-mono text-[10px] px-3 py-2 rounded-md transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#606075' }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        onClick={rotate}
        disabled={pending}
        className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
        style={{
          background: 'rgba(79,70,229,0.08)',
          border: '1px solid rgba(79,70,229,0.2)',
          color: pending ? '#606075' : '#a5a0ff',
        }}
      >
        {pending ? 'Rotating…' : 'Rotate API Key'}
      </button>
      <p className="font-mono text-[10px] mt-2" style={{ color: '#30303f' }}>
        Rotating invalidates the current key immediately.
      </p>
    </div>
  )
}

export function InferenceEndpointSection({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={url}
        onPaste={e => e.preventDefault()}
        className="flex-1 font-mono text-[11px] rounded-md px-3 py-2 outline-none"
        style={{
          background: '#080810',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#e8e8f0',
        }}
      />
      <button
        onClick={copy}
        className="font-mono text-[10px] px-3 py-2 rounded-md transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#606075' }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function DangerZoneSection() {
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deleteQueryHistory(input)
      setDone(true)
      setInput('')
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px]" style={{ color: '#606075' }}>
        This permanently deletes all query events for your workspace. Type{' '}
        <span className="font-mono" style={{ color: '#f87171' }}>DELETE</span> to confirm.
      </p>
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type DELETE"
          className="font-mono text-[11px] rounded-md px-3 py-2 outline-none w-40"
          style={{
            background: '#080810',
            border: '1px solid rgba(239,68,68,0.15)',
            color: '#e8e8f0',
          }}
        />
        <button
          onClick={handleDelete}
          disabled={input !== 'DELETE' || pending || done}
          className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
          style={{
            background: input === 'DELETE' && !done ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: input === 'DELETE' && !done ? '#f87171' : '#606075',
          }}
        >
          {pending ? 'Deleting…' : done ? 'Deleted' : 'Delete All History'}
        </button>
      </div>
    </div>
  )
}
