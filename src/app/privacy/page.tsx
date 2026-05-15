import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Privacy Policy · Highzcore',
  description: "How Highzcore collects, uses, and protects your data.",
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="May 16, 2026">
      <p>
        This Privacy Policy describes how Highzcore (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects
        personal information when you use our website, mini-app, bot, and services.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Highzcore is a creator growth platform operated from Nigeria, serving creators and workers
        worldwide. Our registered contact is{' '}
        <a href="mailto:hello@highzcore.tech">hello@highzcore.tech</a>. For data-protection or
        privacy-specific questions, write to <a href="mailto:legal@highzcore.tech">legal@highzcore.tech</a>.
      </p>

      <h2>2. What we collect</h2>
      <h3>From everyone</h3>
      <ul>
        <li>Account info — email, name, phone, country, preferred language.</li>
        <li>Authentication info — password hash, OAuth tokens, Telegram user id (if linked).</li>
        <li>Usage data — pages viewed, projects created, tasks claimed, IP address, browser/device fingerprint.</li>
      </ul>
      <h3>From creators</h3>
      <ul>
        <li>Channel URL + public channel metadata (handle, subscriber count, niche).</li>
        <li>Payment information processed by Flutterwave / CCPayment / your bank — we never store full card numbers.</li>
        <li>The contents of projects you launch (videos, questions, share messages).</li>
      </ul>
      <h3>From workers</h3>
      <ul>
        <li>Profile info — location, age, languages, niches, devices, hours of availability.</li>
        <li>External-audience details — handles + verified follower counts on platforms you link.</li>
        <li>USDT TRC20 wallet address for payouts.</li>
        <li>Submitted work — responses, votes, share URLs, evidence screenshots.</li>
      </ul>

      <h2>3. How we use it</h2>
      <ul>
        <li>To operate the platform (create accounts, match tasks, process payments and payouts).</li>
        <li>To moderate quality and prevent fraud.</li>
        <li>To improve the platform with aggregate analytics (we don\'t sell individual data).</li>
        <li>To send transactional notifications you opt into (email + Telegram).</li>
        <li>To meet legal obligations (tax records, fraud reporting, dispute resolution).</li>
      </ul>

      <h2>4. Who we share it with</h2>
      <p>We share personal data only with the following categories:</p>
      <ul>
        <li><strong>Service providers</strong>: Supabase (database + auth), Flutterwave (card payments), CCPayment (USDT payouts), nodemailer / Gmail (email), Telegram (bot + mini-app).</li>
        <li><strong>Legal authorities</strong> when compelled by court order or applicable law.</li>
        <li><strong>Within the platform</strong>: creators see the aggregate responses + verbatim quotes from workers; workers see the project the creator launched. We never expose private personal data between roles.</li>
      </ul>
      <p>We do <strong>not</strong> sell personal data to advertisers or data brokers, ever.</p>

      <h2>5. International transfers</h2>
      <p>
        Our infrastructure runs in regions chosen by Supabase. By using Highzcore, you understand that your data may be processed in a different country than where you reside, with standard contractual clauses or equivalent safeguards where required.
      </p>

      <h2>6. Your rights</h2>
      <p>Depending on your jurisdiction (GDPR / CCPA / NDPR / etc.), you have the right to:</p>
      <ul>
        <li>Request a copy of your personal data.</li>
        <li>Correct inaccurate data.</li>
        <li>Delete your account and associated data.</li>
        <li>Object to processing for certain purposes (e.g. analytics).</li>
        <li>Export your data in a machine-readable format.</li>
      </ul>
      <p>Email <a href="mailto:legal@highzcore.tech">legal@highzcore.tech</a> to exercise any of these.</p>

      <h2>7. Retention</h2>
      <p>
        Active account data is retained while your account is open. After account deletion, we retain the minimum data required for legal / tax / fraud-prevention purposes (typically 7 years for financial records). Aggregate, de-identified data may be retained indefinitely.
      </p>

      <h2>8. Cookies + similar technologies</h2>
      <p>
        We use a small set of essential cookies for authentication and preferences. We do not use third-party advertising cookies. See our <a href="/cookie-policy">Cookie Policy</a> for the full list.
      </p>

      <h2>9. Security</h2>
      <p>
        We protect your data with industry-standard measures: HTTPS everywhere, encryption at rest (Supabase + AES-256), row-level security enforced in Postgres, hashed passwords, scoped service-role keys, audit logs of admin actions.
      </p>

      <h2>10. Children</h2>
      <p>
        Highzcore is for adults 18+. We do not knowingly collect data from anyone under 18. If you believe a minor has registered, email us and we will delete the account.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be communicated via email or Telegram at least 30 days before they take effect. The effective date at the top of this page reflects the current version.
      </p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:legal@highzcore.tech">legal@highzcore.tech</a>. Security
        reports: <a href="mailto:security@highzcore.tech">security@highzcore.tech</a>.
      </p>
    </LegalLayout>
  );
}
