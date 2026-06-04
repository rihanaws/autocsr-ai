export function AgentSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const W = 60
  const H = 24
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - (v / max) * (H - 2)
    return `${x},${y}`
  })
  const d = `M ${pts.join(' L ')}`

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={d} fill="none" stroke="#4f46e5" strokeWidth={1} opacity={0.7} />
    </svg>
  )
}
