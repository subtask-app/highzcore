// /worker/tier — achievements + reliability/quality scores.

import { redirect } from 'next/navigation';
import { Award, ShieldCheck, Star, Trophy } from 'lucide-react';
import { Badge, Card, ProgressRing, StatCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchTierStats, fetchWorkerContext } from '@/lib/worker/queries';
import type { WorkerTier } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const TIER_BENEFITS: Record<WorkerTier, { label: string; perks: string[] }> = {
  A: {
    label: 'Tier A — Elite',
    perks: [
      'First access to high-paying tasks',
      'Lower withdrawal fees',
      'Eligible for premium-creator campaigns',
      'Direct feedback channel with admins',
    ],
  },
  B: {
    label: 'Tier B — Trusted',
    perks: [
      'Bigger task allocation',
      'Priority approval for submissions',
      'Eligible for promote campaigns',
    ],
  },
  C: {
    label: 'Tier C — Starter',
    perks: [
      'Insights + AB test tasks',
      'Standard payouts',
      'Build reputation to unlock more',
    ],
  },
};

const TIER_NEXT: Record<WorkerTier, { tier: WorkerTier; requirement: string } | null> = {
  C: { tier: 'B', requirement: '20 approved tasks + 95% completion rate' },
  B: { tier: 'A', requirement: '100 approved tasks + 98% completion rate + 30 days active' },
  A: null,
};

export default async function WorkerTierPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const stats = await fetchTierStats(user.id);
  const tier = ctx.profile.tier;
  const next = TIER_NEXT[tier];
  const benefits = TIER_BENEFITS[tier];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
          Achievements
        </h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Higher tiers unlock better-paying tasks and lower withdrawal fees.
        </p>
      </header>

      {/* Current tier hero */}
      <Card padding="lg" className="flex items-start gap-6 flex-wrap">
        <div className="flex items-center justify-center h-24 w-24 rounded-2xl bg-brand-tint">
          <Trophy className="h-12 w-12 text-brand" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">{benefits.label}</h2>
          <p className="text-sm text-fg-muted">
            {next
              ? `Next: Tier ${next.tier}. ${next.requirement}.`
              : "You're at the top. Keep it up."}
          </p>
          <ul className="mt-2 space-y-1">
            {benefits.perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-fg">
                <Star className="h-3.5 w-3.5 text-brand shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Score breakdown */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ScoreCard
          label="Reliability"
          score={ctx.profile.reliability_score}
          hint="Show up consistently and submit on time."
          color="var(--brand)"
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <ScoreCard
          label="Quality"
          score={ctx.profile.quality_score}
          hint="Thoughtful, complete responses creators trust."
          color="var(--c-product-insights)"
          icon={<Star className="h-4 w-4" />}
        />
        <StatCard
          label="Approved tasks"
          value={stats.approved}
          icon={<Award className="h-4 w-4" />}
        />
        <StatCard
          label="Completion rate"
          value={Math.round(stats.completionRate * 100)}
          suffix="%"
        />
      </section>
    </div>
  );
}

function ScoreCard({ label, score, hint, color, icon }: { label: string; score: number; hint: string; color: string; icon: React.ReactNode }) {
  return (
    <Card padding="md" className="flex items-center gap-4">
      <ProgressRing
        value={score / 100}
        label={`${score}`}
        color={color}
        size={64}
        strokeWidth={6}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle inline-flex items-center gap-1.5">
          {icon}{label}
        </p>
        <p className="mt-1 text-xs text-fg-muted leading-relaxed">{hint}</p>
      </div>
    </Card>
  );
}

// Suppress unused-import lint
void Badge;
