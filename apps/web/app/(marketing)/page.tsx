import { HeroSection } from '@/components/marketing/hero-section'
import { ProblemSection } from '@/components/marketing/problem-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { TrustSection } from '@/components/marketing/trust-section'
import { MetricsSection } from '@/components/marketing/metrics-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { SocialProofSection } from '@/components/marketing/social-proof-section'
import { FaqSection } from '@/components/marketing/faq-section'
import { CTASection } from '@/components/marketing/cta-section'

export default function HomePage() {
  return (
    <main style={{ background: '#090910' }}>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <TrustSection />
      <MetricsSection />
      <PricingSection />
      <SocialProofSection />
      <FaqSection />
      <CTASection />
    </main>
  )
}
