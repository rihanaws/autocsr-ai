'use client'

const AGENTS = [
  {
    name: 'DEPOSIT',
    color: '#22c55e',
    desc: 'Failed deposits, pending payments, balance credits',
  },
  {
    name: 'WITHDRAWAL',
    color: '#f59e0b',
    desc: 'Withdrawal requests, limits, pending transfers',
  },
  {
    name: 'VERIFICATION',
    color: '#c084fc',
    desc: 'KYC, identity docs, account verification',
  },
  {
    name: 'ONBOARDING',
    color: '#60a5fa',
    desc: 'New accounts, registration, welcome bonus',
  },
  {
    name: 'GENERAL',
    color: '#9ca3af',
    desc: 'Catch-all for everything else',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6" style={{ background: '#0f0f18' }}>
      <div className="max-w-5xl mx-auto">
        <h2
          className="font-display font-bold text-balance mb-14"
          style={{ fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.02em', color: '#e8e8f0' }}
        >
          How AutoCSR routes every query
        </h2>

        {/* Flow diagram */}
        <div className="overflow-x-auto mb-12">
          <svg
            viewBox="0 0 760 200"
            preserveAspectRatio="xMidYMid meet"
            className="w-full max-w-3xl mx-auto block"
            aria-label="AutoCSR query routing flow"
          >
            {/* Nodes */}
            {[
              { x: 30,  label: 'Query',        sub: 'user input' },
              { x: 160, label: 'Input Guard',  sub: 'PII redact' },
              { x: 310, label: 'Semantic Cache',sub: '0.92 sim'  },
              { x: 490, label: 'Router',       sub: 'GPT-4o-mini'},
              { x: 640, label: 'Output Guard', sub: 'halluc check'},
            ].map(({ x, label, sub }) => (
              <g key={label} transform={`translate(${x},80)`}>
                <rect
                  x={-45} y={-22} width={90} height={44}
                  rx={5}
                  fill="#141420"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle" y={-5}
                  fontFamily="JetBrains Mono,monospace" fontSize={9}
                  fill="#e8e8f0"
                >
                  {label}
                </text>
                <text
                  textAnchor="middle" y={10}
                  fontFamily="JetBrains Mono,monospace" fontSize={7.5}
                  fill="#606075"
                >
                  {sub}
                </text>
              </g>
            ))}

            {/* Arrows */}
            {[75, 215, 355, 535].map(x => (
              <line key={x} x1={x} y1={80} x2={x + 20} y2={80}
                stroke="rgba(255,255,255,0.12)" strokeWidth={1}
                markerEnd="url(#arr)"
              />
            ))}

            {/* Cache hit branch */}
            <path
              d="M310,58 L310,30 L730,30 L730,80"
              fill="none"
              stroke="#22c55e"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text x={490} y={24} textAnchor="middle"
              fontFamily="JetBrains Mono,monospace" fontSize={7.5}
              fill="#22c55e"
            >
              CACHE HIT — returns instantly at $0 LLM cost
            </text>

            {/* Response node */}
            <g transform="translate(730,80)">
              <rect x={-40} y={-22} width={80} height={44} rx={5}
                fill="#141420"
                stroke="rgba(79,70,229,0.25)"
                strokeWidth={1}
              />
              <text textAnchor="middle" y={5}
                fontFamily="JetBrains Mono,monospace" fontSize={9}
                fill="#a5a0ff"
              >
                Response
              </text>
            </g>

            <defs>
              <marker id="arr" markerWidth={6} markerHeight={6}
                refX={5} refY={3} orient="auto">
                <path d="M0,0 L6,3 L0,6" fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth={1}
                />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
          {AGENTS.map(a => (
            <div
              key={a.name}
              className="rounded-md p-4"
              style={{
                background: '#141420',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${a.color}`,
              }}
            >
              <p className="font-mono text-[9px] font-semibold mb-2" style={{ color: a.color }}>
                {a.name}
              </p>
              <p className="text-[10.5px] leading-snug" style={{ color: '#606075' }}>
                {a.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Cache callout */}
        <div
          className="rounded-md px-5 py-3 inline-block"
          style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          <span className="font-mono text-[11px]" style={{ color: '#22c55e' }}>
            ~68% of queries return instantly at $0 LLM cost
          </span>
        </div>
      </div>
    </section>
  )
}
