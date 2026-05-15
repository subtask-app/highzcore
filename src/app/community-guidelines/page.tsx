import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata = {
  title: 'Community Guidelines · Highzcore',
  description: 'How creators and workers behave on Highzcore.',
  alternates: { canonical: '/community-guidelines' },
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalLayout
      title="Community Guidelines"
      description="A short guide to being a good Highzcore citizen — for creators and workers alike."
      effectiveDate="May 16, 2026"
    >
      <p>
        Highzcore is small, global, and built on trust. This page covers the day-to-day behaviour
        we expect from everyone using the platform. It complements the <a href="/acceptable-use">Acceptable Use Policy</a>, which covers the hard prohibitions.
      </p>

      <h2>For creators</h2>
      <ul>
        <li><strong>Be specific in your projects.</strong> Vague briefs get vague feedback. Tell workers what you want them to evaluate.</li>
        <li><strong>Pay reasonable rates.</strong> The default per-task payouts on each tier are fair — don\'t try to negotiate lower.</li>
        <li><strong>Approve or reject within 48 hours.</strong> Workers depend on your decisions to get paid. Don\'t sit on submissions.</li>
        <li><strong>Reject only with reason.</strong> Tell the worker why so they can do better next time. &quot;Low quality&quot; isn\'t a reason; what was low about it is.</li>
        <li><strong>Don\'t try to contact workers off-platform.</strong> If someone gave you great feedback, leave them a Tier-impacting positive note in the system, not a DM.</li>
      </ul>

      <h2>For workers</h2>
      <ul>
        <li><strong>Read the question. Watch the video.</strong> Honest, thoughtful responses get approved fast and move you up tiers. Skimming gets you rejected.</li>
        <li><strong>Write like you talk.</strong> Workers who write like a survey-bot are filtered out by reviewers. Use your own voice.</li>
        <li><strong>Don\'t collude.</strong> Don\'t coordinate with other workers to vote a particular way or to inflate counts.</li>
        <li><strong>Be honest about your audience.</strong> If you don\'t have 10k Twitter followers, don\'t claim you do. Inflated follower counts get rejected by admins anyway.</li>
        <li><strong>Submit one quality response per project.</strong> Trying to game the system with rapid-fire low-effort answers hurts your reputation.</li>
      </ul>

      <h2>How tiers work</h2>
      <p>
        Workers start at Tier C. Quality + reliability over time move you to Tier B (better task access) and Tier A (premium tasks + lower fees). Bad behavior moves you down — and Tier C with low scores eventually loses task access entirely.
      </p>

      <h2>Quality signals admins use</h2>
      <ul>
        <li>Response length, relevance, and specificity (Insights).</li>
        <li>Whether your reasoning matches your vote (ABTest).</li>
        <li>Whether the post URL you submitted matches the platform you said + actually exists (Promote).</li>
        <li>Patterns: workers who submit suspiciously similar responses across multiple projects get flagged.</li>
        <li>Reports from other workers + creators.</li>
      </ul>

      <h2>If you have a problem with someone</h2>
      <p>
        Use the support channel inside the app or DM the bot. Don\'t take it public. We resolve most disputes within 24 hours.
      </p>

      <h2>If you mess up</h2>
      <p>
        Everyone makes mistakes. A submission rejected for low quality isn\'t the end of the world — re-read the project brief, try again on a different task. Repeated mistakes signal a pattern; consistent quality earns back tier in days, not weeks.
      </p>

      <p className="!mt-12">
        Thanks for being here. Building a platform that works for both sides depends on everyone — creators and workers — treating it like a real community, not a vending machine.
      </p>
    </LegalLayout>
  );
}
