// /creator — home page. Shows a personalised greeting, headline stats, the
// most recent projects, and a CTA grid pushing the creator into the right
// product for their stated goals.

import Link from 'next/link';
import { ArrowRight, BarChart3, MessageSquareHeart, Plus, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Avatar, Button, Card, EmptyState, LinkButton, ProductBadge, productLabel, StatCard } from '@/components/ui';
import { ProjectCard } from '@/components/creator/ProjectCard';
import { createClient } from '@/lib/supabase/server';
import {
  fetchCreatorContext,
  fetchCreatorStats,
  fetchRecentProjects,
} from '@/lib/creator/queries';
import type { Product } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CreatorHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchCreatorContext(user.id);
  if (!ctx) redirect('/login');

  const [stats, recent] = await Promise.all([
    fetchCreatorStats(user.id),
    fetchRecentProjects(user.id, 4),
  ]);

  const firstName = ctx.user.full_name?.split(' ')[0] ?? 'there';
  const goals = ctx.profile?.growth_goals ?? [];

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Creator</p>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-fg mt-1">
            Hey, {firstName}.
          </h1>
          <p className="mt-2 text-base md:text-lg text-fg-muted leading-relaxed max-w-xl">
            {recent.length === 0
              ? "Let's start your first project — pick what you need to learn about your channel."
              : 'Here\'s what\'s happening with your projects right now.'}
          </p>
        </div>
        <LinkButton href="/creator/projects/new" leftIcon={<Plus className="h-4 w-4" />} size="lg">
          New project
        </LinkButton>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="Responses gathered"
          value={stats.totalResponses}
          icon={<MessageSquareHeart className="h-4 w-4" />}
          accent="var(--c-product-insights)"
        />
        <StatCard
          label="Completed projects"
          value={stats.completedProjects}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatCard
          label="Lifetime spend"
          value={stats.lifetimeSpendUsd}
          prefix="$"
          decimals={0}
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      {/* Recent projects */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Recent projects</h2>
          {recent.length > 0 && (
            <Link href="/creator/projects" className="text-sm text-brand font-semibold inline-flex items-center gap-1">
              See all <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <Card padding="md">
            <EmptyState
              icon={<TrendingUp className="h-7 w-7" strokeWidth={1.5} />}
              title="No projects yet"
              description="Start with Audience Insights — 50 honest responses for $50, ready in under 24 hours."
              action={<LinkButton href="/creator/projects/new" leftIcon={<Plus className="h-4 w-4" />}>Start your first project</LinkButton>}
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {recent.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      {/* Recommended products — goal-aware. We surface the products that map
          to the goals the creator picked during onboarding. */}
      <RecommendedSection goals={goals} />
    </div>
  );
}

// ─── Goal → product mapping ─────────────────────────────────────────────────
const GOAL_PRODUCTS: Record<string, Product[]> = {
  audience_feedback: ['insights'],
  better_thumbnails: ['abtest', 'insights'],
  more_views:        ['promote', 'abtest'],
  more_subscribers:  ['promote', 'collab'],
  monetization:     ['insights', 'promote'],
  find_collabs:      ['collab'],
};

const PRODUCT_PITCH: Record<Product, { title: string; description: string }> = {
  insights: {
    title: 'Find out what your audience really thinks',
    description: 'Real viewers in your target demographic watch your video and answer structured questions. From $50.',
  },
  abtest: {
    title: 'Test thumbnails + titles before you publish',
    description: 'Get a statistically significant winner in under an hour. From $10.',
  },
  promote: {
    title: 'Reach new viewers through real audiences',
    description: 'Workers with verified follower counts share your video to their actual followers. From $30.',
  },
  collab: {
    title: 'Find creators in your niche to collab with',
    description: 'Matched by niche + audience size. Escrowed fees, both sides confirm completion.',
  },
  boost: {
    title: 'Boost engagement metrics',
    description: 'Currently unavailable on the main brand.',
  },
};

function RecommendedSection({ goals }: { goals: string[] }) {
  // Deduplicated, in order of goals; fallback to top picks if no goals set.
  const set = new Set<Product>();
  for (const goal of goals) {
    for (const p of GOAL_PRODUCTS[goal] ?? []) set.add(p);
  }
  if (set.size === 0) {
    (['insights', 'abtest', 'promote'] as const).forEach((p) => set.add(p));
  }
  const products = Array.from(set).filter((p) => p !== 'boost').slice(0, 3);

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Recommended for your goals</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {products.map((p) => (
          <Card key={p} variant="interactive" padding="md" className="flex flex-col gap-3">
            <ProductBadge product={p} size="md" />
            <h3 className="text-base font-semibold tracking-tight text-fg">{PRODUCT_PITCH[p].title}</h3>
            <p className="text-sm text-fg-muted leading-relaxed">{PRODUCT_PITCH[p].description}</p>
            <div className="mt-auto pt-2">
              <Link href={`/creator/projects/new?product=${p}`} className="text-sm font-semibold text-brand inline-flex items-center gap-1">
                Start a {productLabel(p).toLowerCase()} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

// Suppress unused — kept for parity with future avatar/button slots
void Avatar; void Button;
