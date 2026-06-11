'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TABS = ['API Access', 'Tenant', 'Danger Zone'] as const
type Tab = typeof TABS[number]

interface TenantInfo {
  id: string
  slug: string
  tier: string
  name: string
}

interface TierStyle { bg: string; border: string; text: string }

const TIER_STYLES: Record<string, TierStyle> = {
  FREE:       { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  text: '#606075' },
  STARTER:    { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',   text: '#60a5fa' },
  GROWTH:     { bg: 'rgba(79,70,229,0.08)',   border: 'rgba(79,70,229,0.25)',   text: '#a5a0ff' },
  ENTERPRISE: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    text: '#22c55e' },
}

// ─── API Access Tab ───────────────────────────────────────────────────────────
interface ApiKeyInfo {
  prefix: string
  environment: string
  createdAt: Date
}

function ApiAccessTab({ apiKey }: { apiKey: ApiKeyInfo | null }) {
  const [ips, setIps] = useState<string[]>([])
  const [newIp, setNewIp] = useState('')
  const [addingIp, setAddingIp] = useState(false)

  useEffect(() => {
    fetch('/api/settings/authorized-ips')
      .then(r => r.ok ? r.json() : { ips: [] })
      .then(d => setIps(d.ips ?? []))
  }, [])

  async function addIp() {
    if (!newIp.trim()) return
    setAddingIp(true)
    const res = await fetch('/api/settings/authorized-ips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: newIp.trim() }),
    })
    if (res.ok) {
      setIps(prev => [...prev, newIp.trim()])
      setNewIp('')
    }
    setAddingIp(false)
  }

  async function removeIp(ip: string) {
    const res = await fetch(`/api/settings/authorized-ips/${encodeURIComponent(ip)}`, { method: 'DELETE' })
    if (res.ok) {
      setIps(prev => prev.filter(x => x !== ip))
    }
  }

  return (
    <div className="space-y-4">
      {/* API Key card */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="font-mono text-[10px] uppercase mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
          API Key
        </p>
        <div className="flex items-center gap-2 mb-3">
          <input
            readOnly
            value={apiKey ? `${apiKey.prefix}${'•'.repeat(18)}` : 'No active API key'}
            className="flex-1 font-mono text-[11px] rounded-md px-3 py-2 outline-none"
            style={{
              background: '#080810',
              border: '1px solid rgba(255,255,255,0.06)',
              color: apiKey ? '#e8e8f0' : '#606075',
              letterSpacing: '0.08em',
            }}
          />
        </div>
        {apiKey && (
          <p className="font-mono text-[10px] mb-2" style={{ color: '#30303f' }}>
            {apiKey.environment} · Issued on {new Date(apiKey.createdAt).toLocaleDateString()}
          </p>
        )}
        <p className="font-mono text-[10px]" style={{ color: '#30303f' }}>
          To rotate your API key, contact support.
        </p>
      </div>

      {/* Authorized IPs card */}
      <div
        className="rounded-lg p-5"
        style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="font-mono text-[10px] uppercase mb-3" style={{ color: '#606075', letterSpacing: '0.05em' }}>
          Authorized IPs
        </p>
        {ips.length === 0 ? (
          <p className="font-mono text-[11px] mb-3" style={{ color: '#30303f' }}>No IPs configured.</p>
        ) : (
          <table className="w-full text-[11px] mb-3" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['IP Address', 'Added', ''].map(h => (
                  <th
                    key={h}
                    className="font-mono text-[10px] text-left pb-2 pr-3 uppercase tracking-[0.08em] font-medium"
                    style={{ color: '#606075' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ips.map(ip => (
                <tr key={ip} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td className="py-2 pr-3 font-mono" style={{ color: '#e8e8f0' }}>{ip}</td>
                  <td className="py-2 pr-3 font-mono" style={{ color: '#606075' }}>
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeIp(ip)}
                      className="font-mono text-[10px] px-2 py-1 rounded"
                      style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newIp}
            onChange={e => setNewIp(e.target.value)}
            placeholder="e.g. 203.0.113.1"
            className="font-mono text-[11px] rounded-md px-3 py-1.5 outline-none w-44"
            style={{ background: '#080810', border: '1px solid rgba(255,255,255,0.08)', color: '#e8e8f0' }}
            onKeyDown={e => e.key === 'Enter' && addIp()}
          />
          <button
            onClick={addIp}
            disabled={addingIp || !newIp.trim()}
            className="font-mono text-[10px] px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', color: '#a5a0ff' }}
          >
            Add IP
          </button>
        </div>
        <p className="font-mono text-[10px] mt-2" style={{ color: '#30303f' }}>
          When IPs are set, only these addresses can call your inference endpoint.
        </p>
      </div>
    </div>
  )
}

// ─── Tenant Tab ───────────────────────────────────────────────────────────────
function TenantTab({ tenant }: { tenant: TenantInfo }) {
  const [copied, setCopied] = useState(false)
  const tierStyle = TIER_STYLES[tenant.tier] ?? TIER_STYLES.FREE

  function copyId() {
    navigator.clipboard.writeText(tenant.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: '#0f0f18', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="font-mono text-[10px] uppercase mb-4" style={{ color: '#606075', letterSpacing: '0.05em' }}>
        Tenant Info
      </p>
      <div className="space-y-4">
        <div>
          <p className="font-mono text-[10px] mb-1" style={{ color: '#606075' }}>Tenant ID</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px]" style={{ color: '#e8e8f0' }}>{tenant.id}</span>
            <button
              onClick={copyId}
              className="font-mono text-[9px] px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: copied ? '#22c55e' : '#606075' }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] mb-1" style={{ color: '#606075' }}>Slug</p>
          <span className="font-mono text-[12px]" style={{ color: '#606075' }}>{tenant.slug}</span>
        </div>
        <div>
          <p className="font-mono text-[10px] mb-1.5" style={{ color: '#606075' }}>Current Plan</p>
          <span
            className="font-mono text-[10px] px-2 py-1 rounded"
            style={{ background: tierStyle.bg, border: `1px solid ${tierStyle.border}`, color: tierStyle.text }}
          >
            {tenant.tier}
          </span>
          {tenant.tier !== 'ENTERPRISE' && (
            <Link
              href="/settings/billing"
              className="font-mono text-[10px] ml-3"
              style={{ color: '#4f46e5' }}
            >
              Upgrade plan →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────
function DangerZoneTab() {
  const [clearInput, setClearInput] = useState('')
  const [clearPending, setClearPending] = useState(false)
  const [clearDone, setClearDone] = useState(false)
  const [disconnectInput, setDisconnectInput] = useState('')
  const [disconnectPending, setDisconnectPending] = useState(false)
  const [disconnectDone, setDisconnectDone] = useState(false)

  async function handleClearTraining() {
    setClearPending(true)
    await fetch('/api/settings/danger-zone/clear-training', { method: 'POST' })
    setClearPending(false)
    setClearDone(true)
    setClearInput('')
  }

  async function handleDisconnect() {
    setDisconnectPending(true)
    await fetch('/api/settings/danger-zone/disconnect', { method: 'POST' })
    setDisconnectPending(false)
    setDisconnectDone(true)
    setDisconnectInput('')
  }

  return (
    <div
      className="rounded-lg p-5 space-y-6"
      style={{ background: '#0f0f18', border: '1px solid rgba(239,68,68,0.2)' }}
    >
      <p
        className="font-mono uppercase text-[10px]"
        style={{ color: '#f87171', letterSpacing: '0.05em' }}
      >
        Danger Zone
      </p>

      {/* Clear training data */}
      <div>
        <p className="font-mono text-[12px] font-semibold mb-1" style={{ color: '#e8e8f0' }}>
          Delete all training data
        </p>
        <p className="text-[11px] mb-3" style={{ color: '#606075' }}>
          Permanently deletes all training examples for this workspace. Type{' '}
          <span className="font-mono" style={{ color: '#f87171' }}>delete my data</span> to confirm.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={clearInput}
            onChange={e => setClearInput(e.target.value)}
            placeholder="delete my data"
            className="font-mono text-[11px] rounded-md px-3 py-2 outline-none w-40"
            style={{ background: '#080810', border: '1px solid rgba(239,68,68,0.15)', color: '#e8e8f0' }}
          />
          <button
            onClick={handleClearTraining}
            disabled={clearInput !== 'delete my data' || clearPending || clearDone}
            className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
            style={{
              background: clearInput === 'delete my data' && !clearDone ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: clearDone ? '#22c55e' : clearInput === 'delete my data' ? '#f87171' : '#606075',
            }}
          >
            {clearPending ? 'Deleting…' : clearDone ? 'Scheduled' : 'Delete training data'}
          </button>
        </div>
        {clearDone && (
          <p className="font-mono text-[10px] mt-1" style={{ color: '#606075' }}>
            This action is irreversible.
          </p>
        )}
      </div>

      <div style={{ borderTop: '1px solid rgba(239,68,68,0.1)', paddingTop: 20 }}>
        <p className="font-mono text-[12px] font-semibold mb-1" style={{ color: '#e8e8f0' }}>
          Disconnect tenant
        </p>
        <p className="text-[11px] mb-3" style={{ color: '#606075' }}>
          Removes all workspace data and cancels your subscription. Type{' '}
          <span className="font-mono" style={{ color: '#f87171' }}>delete my data</span> to confirm.
        </p>
        <div className="flex items-center gap-2">
          <input
            value={disconnectInput}
            onChange={e => setDisconnectInput(e.target.value)}
            placeholder="delete my data"
            className="font-mono text-[11px] rounded-md px-3 py-2 outline-none w-40"
            style={{ background: '#080810', border: '1px solid rgba(239,68,68,0.15)', color: '#e8e8f0' }}
          />
          <button
            onClick={handleDisconnect}
            disabled={disconnectInput !== 'delete my data' || disconnectPending || disconnectDone}
            className="font-mono text-[11px] px-4 py-2 rounded-md transition-colors"
            style={{
              background: disconnectInput === 'delete my data' && !disconnectDone ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: disconnectDone ? '#22c55e' : disconnectInput === 'delete my data' ? '#f87171' : '#606075',
            }}
          >
            {disconnectPending ? 'Processing…' : disconnectDone ? 'Scheduled' : 'Disconnect tenant'}
          </button>
        </div>
        {disconnectDone && (
          <p className="font-mono text-[10px] mt-1" style={{ color: '#606075' }}>
            This action is irreversible.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function SettingsTabs({ apiKey, tenant }: { apiKey: ApiKeyInfo | null; tenant: TenantInfo }) {
  const [active, setActive] = useState<Tab>('API Access')

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex mb-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className="font-mono text-[11px] px-4 py-2.5 transition-colors"
            style={{
              color: active === tab ? '#e8e8f0' : '#606075',
              background: 'none',
              border: 'none',
              borderBottom: active === tab ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {active === 'API Access' && <ApiAccessTab apiKey={apiKey} />}
      {active === 'Tenant' && <TenantTab tenant={tenant} />}
      {active === 'Danger Zone' && <DangerZoneTab />}
    </div>
  )
}
