'use client'

import { useState, useTransition } from 'react'
import { signOutOtherSessions } from '@/app/(dashboard)/settings/profile/actions'

export function SignOutOtherSessionsButton() {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handle() {
    startTransition(async () => {
      await signOutOtherSessions()
      setDone(true)
    })
  }

  return (
    <button
      onClick={handle}
      disabled={pending || done}
      className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
      style={{
        background: done ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        color: done ? '#4ade80' : '#f87171',
      }}
    >
      {pending ? 'Signing out…' : done ? 'Done' : 'Sign out all other sessions'}
    </button>
  )
}
