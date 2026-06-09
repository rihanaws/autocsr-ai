export const metadata = {
  title:       "Request a Demo — AutoCSR",
  description: "AutoCSR is currently in closed pilot. Apply for early access.",
}

export default function DemoPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#090910",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
    }}>
      <div style={{ maxWidth: "480px", textAlign: "center" }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          color: "#4f46e5",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: "0 0 12px",
        }}>
          Closed Pilot — OKBET Live
        </p>
        <h1 style={{
          fontFamily: "'Geist', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: "32px",
          color: "#e8e8f0",
          margin: "0 0 16px",
          letterSpacing: "-0.03em",
        }}>
          Demo access
        </h1>
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          color: "#9898b0",
          fontSize: "15px",
          margin: "0 0 32px",
          lineHeight: 1.6,
        }}>
          AutoCSR is currently in closed pilot.
          The interactive demo opens when we onboard our second operator.
          Apply now to be first in line.
        </p>
        <a href="/signup" style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          display: "inline-block",
          background: "#4f46e5",
          color: "white",
          padding: "10px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500,
        }}>
          Apply for early access
        </a>
      </div>
    </main>
  )
}
