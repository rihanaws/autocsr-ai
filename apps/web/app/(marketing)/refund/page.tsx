import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'AutoCSR Refund Policy — billing terms, refund eligibility, and cancellation process for AutoCSR subscriptions.',
  alternates: { canonical: '/refund' },
  openGraph: {
    title: 'Refund Policy | AutoCSR',
    description: 'Billing terms, refund eligibility, and cancellation for AutoCSR.',
  },
}

const EFFECTIVE_DATE = 'June 8, 2026'
const COMPANY = 'TechSci, Inc.'
const EMAIL_BILLING = 'billing@techsci.co'

export default function RefundPage() {
  return (
    <div style={{ background: '#090910', minHeight: '100vh' }}>
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ background: 'rgba(9,9,16,0.92)', borderColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' }}
      >
        <Link href="/" className="font-display font-bold text-[15px]" style={{ color: '#e8e8f0', letterSpacing: '-0.02em' }}>
          AUTOCSR
        </Link>
        <Link href="/" className="text-[13px] transition-colors" style={{ color: '#606075' }}>
          ← Back to home
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: '#4f46e5' }}>Legal</p>
          <h1 className="font-display font-bold mb-3" style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#e8e8f0', letterSpacing: '-0.03em' }}>
            Refund Policy
          </h1>
          <p className="font-mono text-[12px]" style={{ color: '#606075' }}>
            Effective date: {EFFECTIVE_DATE} · {COMPANY}
          </p>
        </div>

        <div className="space-y-6 text-[14px] leading-relaxed refund-body" style={{ color: '#9898b0' }}>
          <style>{`
            .refund-body p { margin-bottom: 0.75rem; }
            .refund-body a { color: #a5a0ff; text-decoration: underline; text-decoration-color: rgba(165,160,255,0.3); }
            .refund-body a:hover { color: #e8e8f0; }
            .refund-body strong { color: #e8e8f0; font-weight: 600; }
            .refund-body h2 { color: #e8e8f0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
            .refund-body ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
            .refund-body li { margin-bottom: 0.4rem; }
          `}</style>

          <p>
            This Refund Policy explains the conditions under which {COMPANY} (&quot;Company&quot;)
            will issue refunds or credits for AutoCSR subscriptions. This Policy is part of and
            incorporated into our <Link href="/terms">Terms of Service</Link>.
          </p>

          <h2 id="s1">1. General Principle</h2>
          <p>
            AutoCSR subscriptions are <strong>billed in advance</strong> on a monthly or annual basis.
            Because the Service is made available immediately upon payment and involves ongoing
            infrastructure costs, <strong>all subscription fees are generally non-refundable</strong>{' '}
            except as expressly described in this Policy.
          </p>

          <h2 id="s2">2. Free Tier & Pilot Programs</h2>
          <p>
            The Free tier requires no payment and is not subject to this Policy. Free pilot programs
            (including negotiated enterprise pilots) involve no upfront payment and therefore no
            refund process.
          </p>

          <h2 id="s3">3. Eligibility for Refunds</h2>
          <p>You may be eligible for a full or pro-rated refund in the following limited circumstances:</p>
          <ul>
            <li>
              <strong>Service unavailability:</strong> If the Service experienced verified downtime
              exceeding 24 consecutive hours in a given billing month, you may request a pro-rated
              credit for the affected period.
            </li>
            <li>
              <strong>Billing error:</strong> If you were charged an incorrect amount due to a
              Company billing error, we will issue a full correction refund.
            </li>
            <li>
              <strong>Duplicate charge:</strong> If your account was charged twice for the same
              billing period due to a processing error, the duplicate charge will be refunded.
            </li>
            <li>
              <strong>New subscriptions — 7-day grace period:</strong> If you are a new paying
              customer (first paid Subscription, not a free trial conversion) and you request a
              refund within 7 calendar days of your first charge, we will refund the full amount,
              provided you have not used more than 500 queries on the paid plan.
            </li>
            <li>
              <strong>Annual plan cancellation — 30-day window:</strong> If you purchased an annual
              Subscription and request cancellation within 30 days of the annual charge, we will
              refund the unused portion on a pro-rated monthly basis.
            </li>
          </ul>

          <h2 id="s4">4. Non-Refundable Circumstances</h2>
          <p>Refunds will <strong>not</strong> be issued for:</p>
          <ul>
            <li>Monthly subscriptions cancelled mid-period (access continues until period end)</li>
            <li>Unused query quota — query limits that were not fully utilized in a billing period</li>
            <li>Dissatisfaction with AI Output quality (we offer a free pilot for evaluation before committing)</li>
            <li>Failure to use the Service after subscription</li>
            <li>Account suspension due to Terms of Service violations</li>
            <li>Currency exchange rate differences for non-USD payments</li>
            <li>Renewal charges where cancellation was not completed before the renewal date</li>
          </ul>

          <h2 id="s5">5. Cancellation Process</h2>
          <p>
            To cancel your Subscription:
          </p>
          <ul>
            <li>Log in to your AutoCSR dashboard at <strong>autocsr.ai/dashboard/settings/billing</strong></li>
            <li>Click &quot;Manage Billing&quot; to access the billing portal</li>
            <li>Select &quot;Cancel subscription&quot;</li>
          </ul>
          <p>
            Cancellation takes effect at the end of your current billing period. You retain full
            access to paid features until that date. After the billing period ends, your account
            reverts to the Free tier (500 queries/month limit) and your data is retained for 90 days.
          </p>
          <p>
            If you are unable to access the billing portal, contact{' '}
            <a href={`mailto:${EMAIL_BILLING}`}>{EMAIL_BILLING}</a> and we will process the
            cancellation within 2 business days.
          </p>

          <h2 id="s6">6. How to Request a Refund</h2>
          <p>To request a refund under the eligible circumstances above:</p>
          <ul>
            <li>Email <a href={`mailto:${EMAIL_BILLING}`}>{EMAIL_BILLING}</a> with subject line: &quot;Refund Request — [your account email]&quot;</li>
            <li>Include your account email, the charge date, amount, and the reason for the request</li>
            <li>We will respond within 3 business days</li>
          </ul>
          <p>
            Approved refunds are processed to the original payment method within 5–10 business days,
            depending on your bank or card issuer. Processing time is outside Company&apos;s control once
            the refund is initiated.
          </p>

          <h2 id="s7">7. Chargebacks</h2>
          <p>
            We encourage you to contact us at <a href={`mailto:${EMAIL_BILLING}`}>{EMAIL_BILLING}</a>{' '}
            before initiating a chargeback with your card issuer. Unresolved chargebacks may result
            in suspension of your account and additional processing fees. If we determine a chargeback
            was fraudulent or without merit, we reserve the right to pursue recovery.
          </p>

          <h2 id="s8">8. Changes to This Policy</h2>
          <p>
            Company may update this Policy at any time. Material changes will be communicated by
            email with 14 days&apos; notice. Changes do not apply retroactively to previously paid
            periods.
          </p>

          <h2 id="s9">9. Contact</h2>
          <p>
            Billing and refund inquiries:{' '}
            <a href={`mailto:${EMAIL_BILLING}`}>{EMAIL_BILLING}</a><br />
            Response time: within 3 US business days<br />
            {COMPANY} · 1209 Orange Street · Wilmington, DE 19801 · United States
          </p>
        </div>

        <div className="mt-16 pt-8 border-t flex flex-wrap gap-6" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { href: '/terms', label: 'Terms of Service' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/', label: 'Back to AutoCSR' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="font-mono text-[11px] transition-colors"
              style={{ color: '#606075' }}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
