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
    a: 'No. AutoCSR handles 80%+ of routine tickets automatically. Complex cases, disputes, and anything requiring account-level decisions escalate to your human review queue with full conversation context.',
  },
  {
    q: 'How does it learn from our data?',
    a: "Weekly QLoRA fine-tuning on your resolved sessions. 30% new data, 70% replay buffer prevents catastrophic forgetting. Your data is isolated — it never trains other tenants' models.",
  },
  {
    q: 'What if it gives a wrong answer?',
    a: 'An LLM auditor samples 5% of responses asynchronously. Anything scoring below your configured confidence threshold goes to human review before the customer sees it. Default threshold is 0.6.',
  },
  {
    q: 'How long does deployment take?',
    a: '30 days. Week 1: data collection. Weeks 2–3: model training. Week 4: shadow-mode pilot running alongside your existing team. Live when accuracy benchmarks are met.',
  },
  {
    q: 'Is our customer data secure?',
    a: 'PII is scrubbed at ingestion. Amounts are tokenised, names removed, account IDs hashed. Data only flows from authorized IP addresses specified in the signed data access agreement.',
  },
  {
    q: 'What platforms does it integrate with?',
    a: 'LiveAgent natively. Zendesk, Freshdesk, and Intercom via webhook. Any other platform via REST API. Integration setup takes under an hour.',
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
              value={String(i)}
              className="not-last:border-b-0 py-1"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <AccordionTrigger
                className="text-[14px] text-left py-4 hover:no-underline"
                style={{ color: '#e8e8f0' }}
              >
                {faq.q}
              </AccordionTrigger>
              <AccordionContent
                className="text-[13px] leading-relaxed pb-4"
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
