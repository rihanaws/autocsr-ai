'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/(dashboard)/settings/profile/actions'

interface Props {
  name: string
  company: string
}

export function ProfileForm({ name, company }: Props) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputStyle = {
    background: '#080810',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e8e8f0',
    borderRadius: 6,
    fontSize: 12,
    outline: 'none',
    padding: '8px 12px',
    width: '100%',
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await updateProfile(fd)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Display Name</p>
        <input
          name="name"
          defaultValue={name}
          required
          style={inputStyle}
          className="font-mono"
        />
      </div>
      <div>
        <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Company Name</p>
        <input
          name="company"
          defaultValue={company}
          required
          style={inputStyle}
          className="font-mono"
        />
      </div>
      {error && (
        <p className="font-mono text-[11px]" style={{ color: '#f87171' }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
        style={{
          background: saved ? 'rgba(34,197,94,0.1)' : 'rgba(79,70,229,0.1)',
          border: `1px solid ${saved ? 'rgba(34,197,94,0.25)' : 'rgba(79,70,229,0.25)'}`,
          color: saved ? '#4ade80' : '#a5a0ff',
        }}
      >
        {pending ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
      </button>
    </form>
  )
}
