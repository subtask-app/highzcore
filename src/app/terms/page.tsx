import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import TelegramBack from '@/components/telegram/TelegramBack';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8b5cf620_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf620_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Telegram's native top-left back-arrow (no-op outside Telegram). */}
      <TelegramBack href="/" />

      {/* Header */}
      <header className="relative z-10 border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 md:p-12 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-pink-500/10 rounded-xl">
              <FileText className="h-8 w-8 text-pink-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Terms of Service</h1>
              <p className="text-gray-400 mt-2">Last updated: May 7, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p>
                Welcome to Highzcore (formerly SubTask.ng). By accessing or using our platform, you agree
                to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you
                may not use our services.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Highzcore. Please read
                them carefully before using the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Service Description</h2>
              <p>
                Highzcore is a two-sided marketplace that connects YouTube content creators ("Clients")
                with individuals ("Workers") who subscribe to YouTube channels in exchange for payment.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.1 For Clients</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submit YouTube channel for subscriber growth</li>
                <li>Pay fixed prices for subscriber packages</li>
                <li>Track real-time progress toward subscriber goals</li>
                <li>Receive verified, real subscribers from real people</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.2 For Workers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Browse available YouTube channels to subscribe to</li>
                <li>Earn ₦120 per verified subscription task</li>
                <li>Withdraw earnings to Nigerian bank accounts</li>
                <li>Work on your own schedule with no commitments</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.3 Pricing</h3>
              <p><strong>Clients pay:</strong> ₦150 per subscriber</p>
              <p><strong>Workers earn:</strong> ₦120 per verified subscription</p>
              <p><strong>Platform fee:</strong> ₦30 per transaction (20% of client payment)</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old to use Highzcore</li>
                <li>You must have a valid Google account for authentication</li>
                <li>Workers must have a YouTube account to complete tasks</li>
                <li>You must provide accurate and complete information during registration</li>
                <li>You must not be prohibited from using our services under Nigerian law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. User Responsibilities</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">4.1 All Users</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain the security of your account credentials</li>
                <li>Provide accurate and truthful information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not use the platform for fraudulent or illegal activities</li>
                <li>Not create multiple accounts to abuse the system</li>
                <li>Not use bots, scripts, or automation tools</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">4.2 Workers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Real Accounts Only:</strong> You must use your own, genuine Google/YouTube account</li>
                <li><strong>Actual Subscriptions:</strong> You must actually subscribe to channels (verified via YouTube API)</li>
                <li><strong>Maintain Subscriptions:</strong> Keep subscriptions active; unsubscribing may result in earnings reversal</li>
                <li><strong>No Fake Activity:</strong> Do not create fake accounts or use bots to simulate subscriptions</li>
                <li><strong>One Task Per Channel:</strong> You may only complete one subscription task per channel</li>
                <li><strong>Honest Completion:</strong> Only mark tasks complete after genuinely subscribing</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">4.3 Clients</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Valid Channels:</strong> Provide accurate YouTube channel URLs and information</li>
                <li><strong>Payment Responsibility:</strong> Pay for orders via bank transfer before activation</li>
                <li><strong>Reasonable Expectations:</strong> Understand that subscriber delivery takes time</li>
                <li><strong>No Abuse:</strong> Do not abuse the messaging system or harass workers/admins</li>
                <li><strong>YouTube Compliance:</strong> Ensure your channel complies with YouTube Terms of Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. YouTube Terms Compliance</h2>
              <p className="bg-slate-800 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <strong className="text-yellow-300">Important:</strong> By using Highzcore, you agree to comply with YouTube's policies.
              </p>
              <p className="mt-4">
                Highzcore facilitates real subscriptions from real people. We do NOT engage in:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Artificial inflation of metrics</li>
                <li>Bot activity or fake engagement</li>
                <li>Violation of YouTube Community Guidelines</li>
                <li>Any activity that violates <a href="https://www.youtube.com/t/terms" target="_blank" className="text-purple-400 hover:text-purple-300 underline">YouTube Terms of Service</a></li>
              </ul>
              <p className="mt-4 font-semibold text-yellow-300">
                Users are responsible for ensuring their use of Highzcore complies with YouTube's policies.
                Highzcore is not liable for any YouTube account penalties resulting from user actions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Payment Terms</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">6.1 Client Payments</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment must be made via bank transfer to the platform account</li>
                <li>Orders are activated only after payment confirmation by admin</li>
                <li><strong>No Credit:</strong> We do not extend credit or activate orders before payment</li>
                <li><strong>Non-Refundable:</strong> Payments are non-refundable once tasks are activated</li>
                <li>Payment confirmation typically processed within 24 hours during business days</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.2 Worker Payments</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Workers earn ₦120 per verified subscription task</li>
                <li>Earnings are credited to wallet immediately after YouTube API verification</li>
                <li><strong>Minimum Withdrawal:</strong> ₦1,000</li>
                <li><strong>Processing Time:</strong> Withdrawals processed within 3 working days</li>
                <li>Withdrawals paid via bank transfer to provided account details</li>
                <li>Workers responsible for accuracy of bank details</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.3 Verification Process</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All subscriptions verified via YouTube Data API v3</li>
                <li>Workers must complete subscription before marking task complete</li>
                <li>Unverified tasks will not result in payment</li>
                <li>Attempting to fake subscriptions may result in account termination</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.4 Earnings Reversal</h3>
              <p>
                Highzcore reserves the right to reverse earnings in cases of confirmed fraud, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Worker unsubscribes after receiving payment</li>
                <li>Use of fake or bot accounts</li>
                <li>Multiple accounts completing the same task</li>
                <li>Any form of manipulation or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Prohibited Activities</h2>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use automated tools, bots, or scripts to interact with the platform</li>
                <li>Create fake accounts or provide false information</li>
                <li>Attempt to manipulate or circumvent verification systems</li>
                <li>Engage in any form of fraud or deception</li>
                <li>Harass, threaten, or abuse other users or admins</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Access or attempt to access accounts that are not yours</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Resell or redistribute platform services</li>
                <li>Use the platform for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Account Termination</h2>
              <p>
                Highzcore reserves the right to suspend or terminate your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent activity (fake subscriptions, multiple accounts, etc.)</li>
                <li>Violation of YouTube Terms of Service</li>
                <li>Non-payment by clients</li>
                <li>Abuse of the platform, other users, or administrators</li>
                <li>Any activity that threatens platform integrity</li>
              </ul>
              <p className="mt-4">
                Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your access to the platform will be immediately revoked</li>
                <li>Pending withdrawals may be forfeited if fraud is confirmed</li>
                <li>Client orders may be cancelled without refund if payment was fraudulent</li>
                <li>You may appeal termination by contacting support with evidence</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Highzcore owns all platform content, design, code, and branding</li>
                <li>You may not copy, modify, or distribute platform materials</li>
                <li>"Highzcore" and associated logos are our trademarks</li>
                <li>User-generated content (messages, profile info) remains yours, but you grant us license to display it</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Data and Privacy</h2>
              <p>
                Your privacy is important to us. Please review our <Link href="/privacy" className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</Link> to understand:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>What data we collect (email, profile, bank details, YouTube subscription status)</li>
                <li>How we use YouTube Data API (only to verify subscriptions)</li>
                <li>How we store and protect your information</li>
                <li>Your rights to access, revoke, or delete your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Disclaimers</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">11.1 No Affiliation</h3>
              <p>
                Highzcore is NOT affiliated with, endorsed by, or sponsored by YouTube, Google, or Alphabet Inc.
                YouTube is a trademark of Google LLC.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">11.2 No Guarantees</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Monetization:</strong> Reaching 1,000 subscribers does not guarantee YouTube monetization eligibility (watch hours and other criteria also apply)</li>
                <li><strong>Channel Growth:</strong> Subscribers may unsubscribe at any time (natural YouTube behavior)</li>
                <li><strong>YouTube Policies:</strong> We are not responsible for YouTube policy changes or account penalties</li>
                <li><strong>Service Availability:</strong> Platform may experience downtime or interruptions</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">11.3 Worker Classification</h3>
              <p>
                Workers are <strong>independent contractors</strong>, not employees of Highzcore. Workers are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Their own tax obligations on earnings</li>
                <li>Compliance with local employment and tax laws</li>
                <li>Maintaining their own internet connection and devices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by Nigerian law:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Highzcore is provided "as is" without warranties of any kind</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid or earned in the last 3 months</li>
                <li>We are not responsible for YouTube account bans or policy violations</li>
                <li>We are not liable for failed bank transfers due to incorrect account details</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Highzcore, its owners, and affiliates from any claims,
                damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your violation of these Terms</li>
                <li>Your violation of YouTube Terms of Service</li>
                <li>Your fraudulent or illegal activities</li>
                <li>Your infringement of others' rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">14.1 Governing Law</h3>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">14.2 Dispute Process</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Contact Support:</strong> First, contact us at support@highzcore.com to resolve the issue</li>
                <li><strong>Mediation:</strong> If unresolved, we'll attempt good-faith mediation</li>
                <li><strong>Arbitration:</strong> Disputes may be submitted to arbitration under Nigerian law</li>
                <li><strong>Jurisdiction:</strong> Nigerian courts have exclusive jurisdiction for legal proceedings</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email to your registered address</li>
                <li>Prominent notice on the platform dashboard</li>
                <li>Updating the "Last updated" date at the top</li>
              </ul>
              <p className="mt-4">
                Continued use of Highzcore after changes constitutes acceptance of updated Terms.
                If you do not agree to changes, you must stop using the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                will continue in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">17. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy, constitute the entire agreement between
                you and Highzcore regarding use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">18. Contact Information</h2>
              <p>For questions about these Terms:</p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> <a href="mailto:legal@highzcore.com" className="text-purple-400 hover:text-purple-300 underline">legal@highzcore.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@highzcore.com" className="text-purple-400 hover:text-purple-300 underline">support@highzcore.com</a></li>
                <li><strong>Business Address:</strong> [Your Business Address]</li>
              </ul>
            </section>

            <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-6 mt-8">
              <p className="text-sm font-semibold mb-2">Summary of Key Points:</p>
              <ul className="text-sm space-y-1">
                <li>✓ Must be 18+ to use Highzcore</li>
                <li>✓ Workers must use real accounts and actually subscribe</li>
                <li>✓ Clients pay ₦150/subscriber, Workers earn ₦120/task</li>
                <li>✓ All subscriptions verified via YouTube API</li>
                <li>✓ Minimum withdrawal: ₦1,000, processed in 3 days</li>
                <li>✓ Fraud results in account termination</li>
                <li>✓ Comply with YouTube Terms of Service</li>
                <li>✓ Workers are independent contractors</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
