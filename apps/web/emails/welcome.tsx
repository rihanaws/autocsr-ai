import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface WelcomeEmailProps {
  tenantName: string;
  dashboardUrl: string;
}

const steps = [
  { label: "Data Collection", sub: "Active now", active: true },
  { label: "Model Training", sub: "Week 2–3", active: false },
  { label: "Shadow Mode Pilot", sub: "Week 4", active: false },
  { label: "Go Live", sub: "", active: false },
];

export default function WelcomeEmail({ tenantName, dashboardUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your AutoCSR pilot is being configured — welcome aboard</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={logo}>
              <span style={logoText}>AutoCSR</span>
              <span style={badge}>BETA</span>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Subheader */}
          <Section style={section}>
            <Text style={greeting}>Hi {tenantName},</Text>
            <Text style={subheader}>your pilot is being configured.</Text>
            <Text style={body2}>
              We&apos;re setting up your AI-native CSR automation environment. Here&apos;s
              what happens next:
            </Text>
          </Section>

          {/* Timeline */}
          <Section style={section}>
            {steps.map((step, i) => (
              <div key={i} style={timelineRow}>
                <div style={dotWrapper}>
                  <div style={step.active ? dotActive : dotDim} />
                  {i < steps.length - 1 && <div style={connector} />}
                </div>
                <div style={timelineContent}>
                  <Text style={stepNumber}>{i + 1}</Text>
                  <div>
                    <Text style={stepLabel}>{step.label}</Text>
                    {step.sub && (
                      <Text style={step.active ? stepSubActive : stepSub}>{step.sub}</Text>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Section>

          {/* Metrics preview */}
          <Section style={section}>
            <div style={metricsCard}>
              <Text style={metricsTitle}>After 2 weeks of data:</Text>
              <div style={metricsRow}>
                <Text style={metric}>
                  <span style={metricValue}>&lt; 4s</span>
                  <span style={metricLabel}> response time</span>
                </Text>
              </div>
              <div style={metricsRow}>
                <Text style={metric}>
                  <span style={metricValue}>80%+</span>
                  <span style={metricLabel}> auto-resolve rate</span>
                </Text>
              </div>
              <div style={metricsRow}>
                <Text style={metric}>
                  <span style={metricValue}>61%</span>
                  <span style={metricLabel}> cost reduction</span>
                </Text>
              </div>
            </div>
          </Section>

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={dashboardUrl}>
              Open Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footer}>
              TechSci, Inc. | 244 5th Ave Suite 1950, New York, NY 10001
            </Text>
            <Text style={footer}>
              You&apos;re receiving this because you signed up for AutoCSR pilot.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const body: React.CSSProperties = {
  backgroundColor: "#090910",
  fontFamily: "Inter, Arial, sans-serif",
  margin: 0,
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#0f0f18",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
  maxWidth: "560px",
  margin: "0 auto",
  padding: "0",
  overflow: "hidden",
};

const headerSection: React.CSSProperties = {
  padding: "28px 32px 20px",
};

const logo: React.CSSProperties = {
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const logoText: React.CSSProperties = {
  color: "#e8e8f0",
  fontFamily: "Georgia, serif",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "-0.02em",
};

const badge: React.CSSProperties = {
  backgroundColor: "rgba(79,70,229,0.15)",
  border: "1px solid rgba(79,70,229,0.3)",
  borderRadius: "4px",
  color: "#818cf8",
  fontSize: "10px",
  fontFamily: '"Courier New", Courier, monospace',
  fontWeight: 600,
  letterSpacing: "0.08em",
  padding: "2px 6px",
  verticalAlign: "middle",
  marginLeft: "8px",
};

const divider: React.CSSProperties = {
  borderColor: "rgba(255,255,255,0.06)",
  margin: "0",
};

const section: React.CSSProperties = {
  padding: "24px 32px 0",
};

const ctaSection: React.CSSProperties = {
  padding: "28px 32px 32px",
  textAlign: "center",
};

const footerSection: React.CSSProperties = {
  padding: "20px 32px 28px",
};

const greeting: React.CSSProperties = {
  color: "#e8e8f0",
  fontSize: "15px",
  margin: "0 0 4px",
};

const subheader: React.CSSProperties = {
  color: "#e8e8f0",
  fontFamily: "Georgia, serif",
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 16px",
  lineHeight: "1.3",
};

const body2: React.CSSProperties = {
  color: "#606075",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px",
};

// Timeline
const timelineRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "0",
};

const dotWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginRight: "14px",
  marginTop: "2px",
};

const dotActive: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  backgroundColor: "#22c55e",
  flexShrink: 0,
};

const dotDim: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  backgroundColor: "#30303f",
  flexShrink: 0,
};

const connector: React.CSSProperties = {
  width: "1px",
  height: "32px",
  backgroundColor: "rgba(255,255,255,0.06)",
  margin: "4px 0",
};

const timelineContent: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  gap: "10px",
  paddingBottom: "8px",
};

const stepNumber: React.CSSProperties = {
  color: "#30303f",
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: "11px",
  margin: 0,
  minWidth: "14px",
};

const stepLabel: React.CSSProperties = {
  color: "#e8e8f0",
  fontSize: "14px",
  fontWeight: 500,
  margin: 0,
  lineHeight: "1.4",
};

const stepSubActive: React.CSSProperties = {
  color: "#22c55e",
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: "11px",
  margin: "2px 0 0",
  lineHeight: "1.2",
};

const stepSub: React.CSSProperties = {
  color: "#606075",
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: "11px",
  margin: "2px 0 0",
  lineHeight: "1.2",
};

// Metrics card
const metricsCard: React.CSSProperties = {
  backgroundColor: "#141420",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "8px",
  padding: "20px 24px",
  marginBottom: "0",
};

const metricsTitle: React.CSSProperties = {
  color: "#606075",
  fontSize: "12px",
  letterSpacing: "0.04em",
  margin: "0 0 12px",
  textTransform: "uppercase",
};

const metricsRow: React.CSSProperties = {
  marginBottom: "6px",
};

const metric: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
};

const metricValue: React.CSSProperties = {
  color: "#e8e8f0",
  fontFamily: '"Courier New", Courier, monospace',
  fontWeight: 600,
};

const metricLabel: React.CSSProperties = {
  color: "#606075",
};

// CTA
const ctaButton: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 32px",
  textDecoration: "none",
  display: "inline-block",
};

// Footer
const footer: React.CSSProperties = {
  color: "#30303f",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "0 0 4px",
  textAlign: "center",
};
