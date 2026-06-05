'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  name: string | null
  email: string
}

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export function ProfileDropdown({ name, email }: Props) {
  const router = useRouter()
  const ini = initials(name, email)
  const displayName = truncate(name ?? email.split('@')[0], 16)

  const itemStyle = {
    cursor: 'pointer',
    color: '#e8e8f0',
    borderRadius: 6,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex items-center gap-2 outline-none" aria-label="Profile menu" />
        }
      >
        <span
          className="font-mono text-xs flex items-center justify-center shrink-0 rounded-full select-none"
          style={{ width: 28, height: 28, background: 'rgba(79,70,229,0.2)', color: '#a5a0ff' }}
        >
          {ini}
        </span>
        <span
          className="font-mono text-[11px] truncate hidden sm:block"
          style={{ color: '#606075', maxWidth: 120 }}
        >
          {displayName}
        </span>
        <ChevronDown size={12} style={{ color: '#30303f' }} className="shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 p-1"
        style={{
          background: '#141420',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="px-3 py-2">
          <p className="text-xs font-medium" style={{ color: '#e8e8f0' }}>
            {name ?? 'User'}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: '#606075' }}>
            {email}
          </p>
        </div>
        <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
        <DropdownMenuItem style={itemStyle} onClick={() => router.push('/settings/profile')}>
          Profile &amp; Security
        </DropdownMenuItem>
        <DropdownMenuItem style={itemStyle} onClick={() => router.push('/settings/billing')}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuItem style={itemStyle} onClick={() => router.push('/settings')}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ background: 'rgba(255,255,255,0.06)' }} />
        <DropdownMenuItem
          style={{ ...itemStyle, color: '#f87171' }}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
