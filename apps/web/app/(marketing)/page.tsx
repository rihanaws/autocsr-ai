import { HeroSection } from '@/components/marketing/hero-section'
import { ProblemSection } from '@/components/marketing/problem-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { MetricsSection } from '@/components/marketing/metrics-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { CTASection } from '@/components/marketing/cta-section'

export default function HomePage() {
  return (
    <main style={{ background: '#090910' }}>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <MetricsSection />
      <PricingSection />
      <CTASection />
    </main>
  )
}
