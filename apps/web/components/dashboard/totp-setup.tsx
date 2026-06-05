'use client'

import { useState, useTransition } from 'react'
import { initiateTotpSetup, verifyAndEnableTotp, disableTotp } from '@/app/(dashboard)/settings/profile/actions'

interface Props {
  totpEnabled: boolean
}

function chunk(s: string, n: number) {
  return s.match(new RegExp(`.{1,${n}}`, 'g'))?.join(' ') ?? s
}

export function TotpSetup({ totpEnabled }: Props) {
  const [phase, setPhase] = useState<'idle' | 'setup' | 'disabling'>('idle')
  const [setupData, setSetupData] = useState<{ secret: string; dataUrl: string } | null>(null)
  const [token, setToken] = useState('')
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function startSetup() {
    setResult(null)
    startTransition(async () => {
      const data = await initiateTotpSetup()
      setSetupData({ secret: data.secret, dataUrl: data.dataUrl })
      setPhase('setup')
    })
  }

  function verify() {
    if (!token.trim()) return
    startTransition(async () => {
      const r = await verifyAndEnableTotp(token.trim())
      setResult(r)
      if (r.success) {
        setPhase('idle')
        setToken('')
        setSetupData(null)
      }
    })
  }

  function startDisable() {
    setResult(null)
    setToken('')
    setPhase('disabling')
  }

  function confirmDisable() {
    if (!token.trim()) return
    startTransition(async () => {
      const r = await disableTotp(token.trim())
      setResult(r)
      if (r.success) {
        setPhase('idle')
        setToken('')
      }
    })
  }

  if (totpEnabled && phase !== 'disabling') {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[9px] px-2 py-1 rounded"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              color: '#4ade80',
            }}
          >
            ACTIVE
          </span>
          <span className="text-[12px]" style={{ color: '#606075' }}>
            Authenticator app connected
          </span>
        </div>
        <button
          onClick={startDisable}
          className="font-mono text-[11px] px-3 py-1.5 rounded-md transition-colors"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
          }}
        >
          Disable 2FA
        </button>
      </div>
    )
  }

  if (phase === 'disabling') {
    return (
      <div className="space-y-3">
        <p className="text-[12px]" style={{ color: '#606075' }}>
          Enter your current authenticator code to disable 2FA.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={token}
            onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="font-mono text-[13px] w-28 text-center rounded-md px-3 py-2 outline-none tracking-widest"
            style={{ background: '#080810', border: '1px solid rgba(239,68,68,0.2)', color: '#e8e8f0' }}
          />
          <button
            onClick={confirmDisable}
            disabled={token.length !== 6 || pending}
            className="font-mono text-[11px] px-3 py-2 rounded-md transition-colors"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
          >
            {pending ? 'Verifying…' : 'Confirm Disable'}
          </button>
          <button
            onClick={() => { setPhase('idle'); setToken(''); setResult(null) }}
            className="font-mono text-[11px] px-3 py-2 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
          >
            Cancel
          </button>
        </div>
        {result?.error && <p className="font-mono text-[11px]" style={{ color: '#f87171' }}>{result.error}</p>}
      </div>
    )
  }

  if (phase === 'setup' && setupData) {
    return (
      <div className="space-y-4">
        <p className="text-[12px]" style={{ color: '#606075' }}>
          Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
        </p>
        <div className="flex gap-6 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={setupData.dataUrl} alt="TOTP QR code" width={140} height={140} className="rounded-md" />
          <div>
            <p className="font-mono text-[10px] mb-2" style={{ color: '#606075' }}>Manual entry code:</p>
            <p
              className="font-mono text-[12px] p-2 rounded-md select-all"
              style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', color: '#a5a0ff', letterSpacing: '0.15em' }}
            >
              {chunk(setupData.secret, 4)}
            </p>
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Verification code</p>
          <div className="flex items-center gap-2">
            <input
              value={token}
              onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="font-mono text-[13px] w-28 text-center rounded-md px-3 py-2 outline-none tracking-widest"
              style={{ background: '#080810', border: '1px solid rgba(79,70,229,0.2)', color: '#e8e8f0' }}
            />
            <button
              onClick={verify}
              disabled={token.length !== 6 || pending}
              className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
              style={{ background: 'rgba(79,70,229,0.12)', border: '1px solid rgba(79,70,229,0.25)', color: '#a5a0ff' }}
            >
              {pending ? 'Verifying…' : 'Verify & Enable'}
            </button>
            <button
              onClick={() => { setPhase('idle'); setSetupData(null); setToken(''); setResult(null) }}
              className="font-mono text-[11px] px-3 py-2 rounded-md"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#606075' }}
            >
              Cancel
            </button>
          </div>
          {result?.error && <p className="font-mono text-[11px] mt-2" style={{ color: '#f87171' }}>{result.error}</p>}
          {result?.success && <p className="font-mono text-[11px] mt-2" style={{ color: '#4ade80' }}>2FA enabled successfully</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12px] mb-1" style={{ color: '#606075' }}>
          Add an extra layer of security to your account.
        </p>
        <p className="font-mono text-[10px]" style={{ color: '#30303f' }}>
          Requires an authenticator app on your device.
        </p>
      </div>
      <button
        onClick={startSetup}
        disabled={pending}
        className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
        style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)', color: '#a5a0ff' }}
      >
        {pending ? 'Loading…' : 'Enable 2FA'}
      </button>
    </div>
  )
}
