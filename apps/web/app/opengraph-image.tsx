import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'AutoCSR — AI CSR automation for betting operators'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#090910',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        padding: '72px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '72px',
          right: '72px',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#4f46e5',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          TECHSCI, INC.
        </div>

        <div style={{
          width: '48px',
          height: '3px',
          background: '#4f46e5',
          marginBottom: '24px',
          borderRadius: '2px',
        }} />

        <div style={{
          fontFamily: 'system-ui',
          fontWeight: 800,
          fontSize: '80px',
          color: '#e8e8f0',
          letterSpacing: '-3px',
          lineHeight: 1,
          marginBottom: '20px',
        }}>
          AutoCSR
        </div>

        <div style={{
          fontFamily: 'system-ui',
          fontSize: '26px',
          color: '#9898b0',
          fontWeight: 400,
          marginBottom: '48px',
          lineHeight: 1.4,
        }}>
          AI backbone for betting operator customer service
        </div>

        <div style={{
          display: 'flex',
          gap: '40px',
        }}>
          {[
            { value: '61%',  label: 'cost reduction' },
            { value: '94ms', label: 'avg response' },
            { value: '24/7', label: 'availability' },
          ].map(s => (
            <div key={s.value} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '28px',
                fontWeight: 700,
                color: '#e8e8f0',
              }}>
                {s.value}
              </span>
              <span style={{
                fontFamily: 'system-ui',
                fontSize: '13px',
                color: '#606075',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
