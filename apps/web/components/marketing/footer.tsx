'use client'

import Link from 'next/link'

const links = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy',   href: '/privacy' },
  { label: 'Refund Policy',    href: '/refund' },
  { label: 'Pricing',          href: '/pricing' },
]

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: '#090910',
      padding: '32px 40px',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <span style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '-0.02em',
          color: '#e8e8f0',
        }}>
          AUTOCSR
        </span>

        <nav style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '13px',
                color: '#606075',
                textDecoration: 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9898b0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#606075')}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: '12px',
          color: '#30303f',
        }}>
          © {new Date().getFullYear()} TechSci, Inc.
        </span>
      </div>
    </footer>
  )
}
