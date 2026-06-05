'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Does it replace all my agents?',
    a: 'No. AutoCSR handles 80%+ of incoming tickets autonomously. Complex cases, escalations, and low-confidence responses are routed to your human review queue immediately.',
  },
  {
    q: 'How does it learn from our data?',
    a: "Weekly QLoRA fine-tuning runs on your resolved session history. Your data exclusively trains your tenant's LoRA adapters and is never shared with or used to improve other tenants' models.",
  },
  {
    q: 'What happens if it gives a wrong answer?',
    a: 'An LLM auditor samples 5% of all responses. Any answer with confidence below threshold is held for human review before delivery. You can tighten or loosen this threshold in settings.',
  },
  {
    q: 'How long does deployment take?',
    a: '30 days from signed agreement to live traffic. Week 1: data collection via Chrome extension. Weeks 2–3: model training and evaluation. Week 4: pilot in shadow mode before full cutover.',
  },
  {
    q: 'Is our customer data secure?',
    a: 'PII is scrubbed at ingestion before any query reaches the model. All stored data is AES-GCM encrypted. Anonymized queries only. Data never leaves your authorized IP range per the signed data agreement.',
  },
  {
    q: 'What platforms does it integrate with?',
    a: 'LiveAgent (native connector). Zendesk, Freshdesk, and Intercom via webhook. Any custom platform via REST API. Integration setup is included in the onboarding week.',
  },
]

export function FaqSection() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: '#090910', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="font-display font-bold text-balance mb-12"
          style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', letterSpacing: '-0.02em', color: '#e8e8f0' }}
        >
          Common questions
        </h2>

        <Accordion>
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              className="not-last:border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <AccordionTrigger
                className="font-mono text-[13px] text-left py-5 hover:no-underline"
                style={{ color: '#e8e8f0' }}
              >
                {faq.q}
              </AccordionTrigger>
              <AccordionContent
                className="text-[13px] leading-relaxed pb-5"
                style={{ color: '#606075' }}
              >
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
