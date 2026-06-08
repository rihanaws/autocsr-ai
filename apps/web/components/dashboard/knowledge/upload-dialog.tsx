'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const ACCEPT = '.pdf,.txt,.md,.csv'

export function UploadDocumentDialog({ onUploaded }: { onUploaded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !name) setName(f.name.replace(/\.[^.]+$/, ''))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', name || file.name)
      const res = await fetch('/api/knowledge/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }
      setOpen(false)
      setFile(null)
      setName('')
      if (fileRef.current) fileRef.current.value = ''
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
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
  } as const

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
        style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
      >
        Upload document
      </DialogTrigger>
      <DialogContent
        className="max-w-md"
        style={{ background: '#111119', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0' }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-display)', color: '#e8e8f0', fontSize: 14 }}>
            Upload document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>File</p>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              required
              className="font-mono text-[11px] w-full"
              style={{
                color: '#606075',
                background: '#0a0a14',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '8px 10px',
              }}
            />
            <p className="font-mono text-[9px] mt-1" style={{ color: '#30303f' }}>
              Accepted: .pdf .txt .md .csv
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Name</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Document name"
              required
              style={inputStyle}
            />
          </div>
          {error && (
            <p className="font-mono text-[10px]" style={{ color: '#f87171' }}>{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-1">
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
              disabled={loading || !file}
              className="font-mono text-[11px] px-4 py-2 rounded-md"
              style={{
                background: loading ? 'rgba(79,70,229,0.4)' : '#4f46e5',
                color: '#fff',
                border: 'none',
                opacity: !file ? 0.5 : 1,
              }}
            >
              {loading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
