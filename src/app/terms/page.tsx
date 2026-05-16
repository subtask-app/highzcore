import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Terms of Service · Highzcore',
  description: "The rules of using Highzcore.",
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate="May 16, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Highzcore. By creating an account or using the platform, you agree to these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>You must be at least 18 years old to use Highzcore. Workers must additionally:</p>
      <ul>
        <li>Provide accurate location, language, and demographic info.</li>
        <li>Provide a valid USDT TRC20 wallet address to withdraw earnings.</li>
        <li>Submit honest, non-AI-generated, non-collusive work.</li>
      </ul>

      <h2>2. Accounts</h2>
      <p>
        You are responsible for your account credentials. Don't share your password or session
        with anyone. We don't allow account sharing; one human, one account.
      </p>

      <h2>3. Roles</h2>
      <p>
        A single Highzcore account can hold any combination of three roles: creator, worker, admin.
        Each role has its own dashboard and rules below.
      </p>

      <h3>Creator role</h3>
      <ul>
        <li>You agree the YouTube channel you link is genuinely yours or that you have authority to act on its behalf.</li>
        <li>You agree to fund projects in advance. We don't extend credit.</li>
        <li>You agree not to use Highzcore to source artificial engagement (subscribers, views, likes, comments) on YouTube or any other platform — see <a href="/acceptable-use">Acceptable Use</a>.</li>
      </ul>

      <h3>Worker role</h3>
      <ul>
        <li>You agree to provide honest, thoughtful work — not template answers, not AI-generated text passed off as your own.</li>
        <li>You agree not to operate multiple accounts to collect more payouts.</li>
        <li>You agree not to attempt to identify creators or contact them outside the platform.</li>
        <li>You agree to keep your USDT wallet address current. Withdrawals to wrong addresses are unrecoverable.</li>
      </ul>

      <h2>4. Payments</h2>
      <p>
        Creators pay per project at creation time via Flutterwave (card), CCPayment (USDT), or direct bank transfer. Payments are non-refundable except per our <a href="/refund-policy">Refund Policy</a>.
      </p>
      <p>Workers earn per approved task. Withdrawals are USDT TRC20 only, minimum $10, flat $1 fee.</p>

      <h2>5. Platform fees</h2>
      <ul>
        <li>Insights, ABTest, Promote: 30% of the project total. The remaining 70% funds the worker pool.</li>
        <li>Collab: 15% of each side's escrow.</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        You retain ownership of content you upload (videos, thumbnails, share messages). By uploading, you grant us a worldwide, non-exclusive license to display it within the platform for the purpose of operating the service — e.g. showing a thumbnail to workers in an AB test.
      </p>
      <p>
        Worker responses become available to the creator who paid for them. Workers retain underlying copyright but grant creators a perpetual license to use the responses for analysis and content decisions.
      </p>

      <h2>7. Termination + suspension</h2>
      <p>
        We may suspend or terminate any account that violates these Terms, our Acceptable Use Policy, or the law. In serious cases (fraud, abuse) suspension can be immediate; otherwise we'll give you written notice + a chance to appeal.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        Highzcore is provided &quot;as is&quot;. We do not guarantee virality, ranking improvements, or any specific metric outcome. We do not guarantee that workers represent your target audience perfectly — only that they match the demographic filters you set.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Highzcore is not liable for any indirect or consequential damages arising from use of the platform. Our total liability in any 12-month period is capped at the total fees you paid us during that period.
      </p>

      <h2>10. Disputes + governing law</h2>
      <p>
        These Terms are governed by the laws of Nigeria. Disputes are resolved first by good-faith negotiation, then by binding arbitration in Lagos, Nigeria. Small-claims rights remain available in your local jurisdiction.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms; material changes will be communicated at least 30 days in advance via email or Telegram. Continued use after the effective date constitutes acceptance.
      </p>

      <h2>12. Contact</h2>
      <p>
        General: <a href="mailto:hello@highzcore.tech">hello@highzcore.tech</a>. Legal:{' '}
        <a href="mailto:legal@highzcore.tech">legal@highzcore.tech</a>.
      </p>
    </LegalLayout>
  );
}
