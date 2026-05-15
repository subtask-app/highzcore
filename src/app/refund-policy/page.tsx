import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Refund Policy · Highzcore',
  description: 'When and how Highzcore refunds payments.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="May 16, 2026">
      <p>
        Highzcore is a pay-per-project platform. This policy describes when and how we refund
        creator payments.
      </p>

      <h2>Automatic refunds</h2>
      <p>You\'re automatically refunded in the following cases — no support ticket needed:</p>
      <ul>
        <li><strong>Project doesn\'t fill within 7 days.</strong> If your project closes with fewer responses / votes / shares than you paid for, the unfilled portion is automatically refunded to your original payment method (or USDT wallet for crypto payments).</li>
        <li><strong>Project cancelled before any task is approved.</strong> Cancel from your project detail page. Full refund of the worker pool.</li>
        <li><strong>Withdrawal failure (workers).</strong> If a USDT withdrawal fails, the full amount is automatically returned to your Available balance with no fee charged.</li>
      </ul>

      <h2>Manual refunds — eligible cases</h2>
      <p>Email <a href="mailto:hello@highzcore.tech">hello@highzcore.tech</a> within 30 days to request a manual refund if:</p>
      <ul>
        <li>You were double-charged.</li>
        <li>The product was substantially broken at the time of your payment (verified by our team).</li>
        <li>An admin error caused you actual financial harm.</li>
      </ul>

      <h2>Non-refundable cases</h2>
      <ul>
        <li><strong>Project filled successfully but you didn\'t like the answers.</strong> Subjective dissatisfaction with audience feedback isn\'t a refund reason — that\'s the product working.</li>
        <li><strong>Collab declined or cancelled.</strong> If the other side declines, you\'re refunded the worker pool but NOT the platform fee. Same if you cancel after the proposal was sent.</li>
        <li><strong>Charges older than 90 days</strong> — your bank or card issuer\'s window may be shorter.</li>
      </ul>

      <h2>Disputes</h2>
      <p>
        If a project did not deliver as expected because of fraud, low-quality work, or platform
        failure, raise it with us first. We resolve disputes within 7 business days. If we can\'t
        agree, you keep your right to charge back via your card issuer or bank.
      </p>

      <h2>Processing time</h2>
      <p>
        Card refunds via Flutterwave: 5–10 business days. USDT refunds via CCPayment: same-day
        on TRC20. Bank transfer refunds: depends on the bank, typically 3–5 business days.
      </p>

      <h2>Contact</h2>
      <p>
        Refund requests: <a href="mailto:hello@highzcore.tech">hello@highzcore.tech</a>. Include
        your project id and the reason. We aim to respond within 1 business day.
      </p>
    </LegalLayout>
  );
}
