import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8b5cf620_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf620_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

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
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Shield className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
              <p className="text-gray-400 mt-2">Last updated: May 7, 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to Highzcore (formerly SubTask.ng). We are committed to protecting your privacy
                and handling your data in an open and transparent manner. This Privacy Policy explains
                how we collect, use, store, and protect your personal information when you use our platform.
              </p>
              <p>
                Highzcore is a two-sided marketplace connecting YouTube content creators with workers who
                help them reach subscriber goals. By using our service, you agree to the collection and
                use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">2.1 Google OAuth Data</h3>
              <p>When you sign up using Google OAuth, we collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Email Address:</strong> Used for account creation, login, and sending transactional notifications</li>
                <li><strong>Profile Information:</strong> Your name and profile picture for identification and personalization</li>
                <li><strong>Google Account ID:</strong> A unique identifier to link your Highzcore account with Google</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.2 YouTube Data</h3>
              <p className="font-semibold text-yellow-300">Important: We access minimal YouTube data</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>What we access:</strong> YouTube subscription status (read-only)</li>
                <li><strong>Why we access it:</strong> To verify that workers have subscribed to creator channels</li>
                <li><strong>When we access it:</strong> Only when a worker marks a task as complete</li>
                <li><strong>What we check:</strong> "Is this user subscribed to channel X?" (Yes/No)</li>
              </ul>

              <p className="bg-slate-800 border-l-4 border-purple-500 p-4 rounded-r-lg mt-4">
                <strong>What we DO NOT access:</strong> Watch history, liked videos, playlists, comments,
                video uploads, analytics, private information, or any other YouTube data beyond subscription status.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.3 Financial Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Bank Details:</strong> For workers requesting withdrawals (bank name, account number, account name)</li>
                <li><strong>Transaction Records:</strong> Earnings, withdrawals, and payment history</li>
                <li><strong>Wallet Balance:</strong> Your current earnings balance on the platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">2.4 Platform Usage Data</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tasks completed and verification status</li>
                <li>Channel subscription orders (for creators)</li>
                <li>Messages exchanged with platform administrators</li>
                <li>Login timestamps and session data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">3.1 Account Management</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create and maintain your account</li>
                <li>Authenticate your identity when you log in</li>
                <li>Display your profile information in the dashboard</li>
                <li>Communicate with you about your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">3.2 Task Verification</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Verify that workers have completed subscription tasks</li>
                <li>Prevent fraud and ensure creators receive real subscribers</li>
                <li>Credit worker wallets after successful verification</li>
                <li>Maintain platform integrity and trust</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">3.3 Payment Processing</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process withdrawal requests from workers</li>
                <li>Transfer earnings to your bank account</li>
                <li>Maintain transaction records for accounting</li>
                <li>Comply with financial regulations</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">3.4 Communication</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Send transactional emails (payment confirmations, task completions)</li>
                <li>Notify you of important platform updates</li>
                <li>Respond to support requests</li>
                <li>Facilitate messaging between users and administrators</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. How We Store Your Information</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">4.1 Data Storage</h3>
              <p>
                All user data is stored securely in Supabase (PostgreSQL database) with industry-standard encryption:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data is encrypted at rest and in transit (SSL/TLS)</li>
                <li>OAuth tokens are stored encrypted</li>
                <li>Bank details are encrypted before storage</li>
                <li>Regular security updates and monitoring</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">4.2 Data Retention</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years (regulatory requirement)</li>
                <li><strong>YouTube Verification Results:</strong> Only subscription status (yes/no) is stored, not raw YouTube data</li>
                <li><strong>OAuth Tokens:</strong> Automatically refreshed and can be revoked anytime</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">5.1 Google APIs</h3>
              <p>
                We use Google OAuth and YouTube Data API v3 for authentication and subscription verification.
                When you use our service, you're also subject to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Google Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 underline">https://policies.google.com/privacy</a></li>
                <li>YouTube Terms of Service: <a href="https://www.youtube.com/t/terms" target="_blank" className="text-purple-400 hover:text-purple-300 underline">https://www.youtube.com/t/terms</a></li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">5.2 Supabase</h3>
              <p>
                We use Supabase for database hosting and authentication infrastructure.
                Supabase Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" className="text-purple-400 hover:text-purple-300 underline">https://supabase.com/privacy</a>
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">5.3 Vercel</h3>
              <p>
                Our platform is hosted on Vercel.
                Vercel Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" className="text-purple-400 hover:text-purple-300 underline">https://vercel.com/legal/privacy-policy</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights and Controls</h2>

              <h3 className="text-xl font-semibold text-purple-300 mb-3">6.1 Access Your Data</h3>
              <p>You can view your personal information anytime by logging into your dashboard.</p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.2 Revoke YouTube Access</h3>
              <p>You can revoke Highzcore's access to your YouTube data at any time:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Go to <a href="https://myaccount.google.com/permissions" target="_blank" className="text-purple-400 hover:text-purple-300 underline">Google Account Permissions</a></li>
                <li>Find "Highzcore" in the list</li>
                <li>Click "Remove Access"</li>
              </ul>
              <p className="text-yellow-300 mt-2">
                Note: Revoking access will prevent you from completing tasks, but won't delete your account or earnings.
              </p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.3 Delete Your Account</h3>
              <p>To request account deletion, contact us at <a href="mailto:privacy@highzcore.com" className="text-purple-400 hover:text-purple-300 underline">privacy@highzcore.com</a></p>
              <p>We will:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Delete your personal information within 30 days</li>
                <li>Retain transaction records for regulatory compliance (7 years)</li>
                <li>Process any pending withdrawals before deletion</li>
              </ul>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">6.4 Opt-Out of Emails</h3>
              <p>You can unsubscribe from marketing emails (if any) by clicking the unsubscribe link. Transactional emails (payment confirmations, etc.) cannot be disabled as they're essential for service operation.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Sharing</h2>
              <p className="font-semibold">We do NOT sell your personal information to third parties.</p>

              <h3 className="text-xl font-semibold text-purple-300 mb-3 mt-6">We may share data only in these cases:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>With Google:</strong> When verifying subscriptions via YouTube API (minimal data)</li>
                <li><strong>With Banks:</strong> Your bank details to process withdrawals</li>
                <li><strong>Legal Requirements:</strong> If required by Nigerian law or valid legal process</li>
                <li><strong>Business Transfer:</strong> If Highzcore is acquired, data may transfer to new owner (you'll be notified)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Security</h2>
              <p>We implement industry-standard security measures:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Encrypted storage for sensitive data</li>
                <li>Regular security audits and updates</li>
                <li>Secure authentication via Supabase Auth</li>
                <li>Role-based access controls</li>
              </ul>
              <p className="text-yellow-300 mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p>
                Highzcore is not intended for users under 18 years of age. We do not knowingly collect
                personal information from children. If you believe a child has provided us with personal
                information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Compliance</h2>
              <p>Highzcore complies with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Nigerian Data Protection Regulation (NDPR):</strong> We follow NDPR guidelines for data processing</li>
                <li><strong>GDPR Principles:</strong> We respect international privacy best practices</li>
                <li><strong>YouTube API Services Terms:</strong> We comply with YouTube's API policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email notification to your registered address</li>
                <li>Prominent notice on the platform</li>
                <li>Updating the "Last updated" date at the top</li>
              </ul>
              <p className="mt-4">
                Continued use of Highzcore after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p>For privacy-related questions or requests:</p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>Email:</strong> <a href="mailto:privacy@highzcore.com" className="text-purple-400 hover:text-purple-300 underline">privacy@highzcore.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:support@highzcore.com" className="text-purple-400 hover:text-purple-300 underline">support@highzcore.com</a></li>
                <li><strong>Address:</strong> [Your Business Address]</li>
              </ul>
            </section>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6 mt-8">
              <p className="text-sm">
                <strong>Summary:</strong> We only collect data necessary to operate the platform.
                We use YouTube API solely to verify subscriptions (nothing else). Your data is encrypted
                and secure. You have full control and can revoke access anytime. We never sell your information.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}