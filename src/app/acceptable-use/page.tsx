import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Acceptable Use Policy · Highzcore',
  description: 'What you can and cannot do on Highzcore.',
  alternates: { canonical: '/acceptable-use' },
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" effectiveDate="May 16, 2026">
      <p>
        Highzcore is a tool for legitimate creator growth. This policy spells out what you can\'t use it for. Violations can result in immediate suspension, project cancellation without refund, and (in serious cases) legal action.
      </p>

      <h2>Prohibited content + projects</h2>
      <p>You may not use Highzcore to promote, test, or seek feedback on:</p>
      <ul>
        <li>Illegal activity, fraud, scams, MLM / pyramid schemes.</li>
        <li>Sexually explicit content, content sexualising minors, or other material that violates YouTube\'s Community Guidelines.</li>
        <li>Hate speech, harassment, threats, doxxing, or content that targets a person or group based on protected characteristics.</li>
        <li>Misleading health, financial, or political claims.</li>
        <li>Copyrighted material you don\'t own or have a license for.</li>
        <li>Content that promotes or facilitates the artificial inflation of engagement metrics on any platform.</li>
      </ul>

      <h2>Prohibited behaviour (creators)</h2>
      <ul>
        <li>Attempting to contact workers outside the platform to bypass moderation or fees.</li>
        <li>Using Highzcore to coordinate paid engagement schemes on YouTube or any other platform.</li>
        <li>Submitting projects that don\'t match the actual content shown to workers.</li>
        <li>Creating multiple accounts to evade limits or game rankings.</li>
      </ul>

      <h2>Prohibited behaviour (workers)</h2>
      <ul>
        <li>Operating multiple worker accounts to claim more tasks.</li>
        <li>Submitting AI-generated answers as your own work.</li>
        <li>Submitting template responses across multiple tasks without genuine engagement with each one.</li>
        <li>Faking audience handles or follower counts.</li>
        <li>Collusion with creators to game results or get paid for fake work.</li>
        <li>Trying to identify creators or contact them off-platform.</li>
      </ul>

      <h2>Security + integrity</h2>
      <ul>
        <li>Don\'t probe, scan, or test the vulnerability of any Highzcore system.</li>
        <li>Don\'t use bots, scrapers, or automated tools against the platform.</li>
        <li>Don\'t attempt to forge requests, bypass auth, or manipulate the database directly.</li>
        <li>Report security vulnerabilities responsibly to <a href="mailto:security@highzcore.tech">security@highzcore.tech</a>.</li>
      </ul>

      <h2>Enforcement</h2>
      <p>
        We review every submitted task and audience for compliance with this policy. Repeated violations move your account through a graduated response: warning → tier downgrade → suspension → permanent ban. Severe single violations (fraud, illegal content, security attacks) result in immediate permanent ban + forfeiture of pending earnings.
      </p>

      <h2>Reporting violations</h2>
      <p>
        See something against this policy? Email <a href="mailto:hello@highzcore.tech">hello@highzcore.tech</a> with details. We act on credible reports within 24 hours.
      </p>
    </LegalLayout>
  );
}
