// /creator/projects/new/collab — landing for the Collab product.
// Explains how collabs work + opens the creator directory inline.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Card, EmptyState, ProductBadge, productLabel } from '@/components/ui';
import { CreatorCard } from '@/components/collab/CreatorCard';
import { createClient } from '@/lib/supabase/server';
import { fetchDirectory } from '@/lib/collab/queries';
import { fetchCreatorContext } from '@/lib/creator/queries';
import { NICHES } from '@/lib/onboarding/catalog';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ niche?: string }>;
}

export default async function NewCollabPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchCreatorContext(user.id);
  if (!ctx) redirect('/login');

  const sp = await searchParams;
  const niche = sp.niche;

  const creators = await fetchDirectory({
    niche,
    excludeUserId: user.id,
    limit: 40,
  });

  return (
    <div className="space-y-10">
      <Link href="/creator/projects/new" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to product picker
      </Link>

      <header className="flex items-start gap-4">
        <ProductBadge product="collab" size="xl" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
            {productLabel('collab')}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg leading-tight mt-1">
            Find a creator to collab with
          </h1>
          <p className="mt-2 text-sm md:text-base text-fg-muted leading-relaxed max-w-xl">
            Browse other Highzcore creators, propose a collab, and lock in terms with two-sided escrow.
          </p>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <InfoCard
          Icon={Users}
          title="Match by niche"
          description="See creators in the same niches as you. Filter further by audience size."
        />
        <InfoCard
          Icon={ShieldCheck}
          title="Two-sided escrow"
          description="Both creators put up the same amount. Released when both confirm completion."
        />
        <InfoCard
          Icon={Sparkles}
          title="Four collab types"
          description="Shoutout, joint video, joint live stream, or channel feature — you pick."
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
            {niche ? `Creators in ${niche}` : 'All creators'}
          </h2>
          <Link href="/creator/collab" className="text-sm text-brand font-semibold inline-flex items-center gap-1">
            My collabs <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <NicheFilter active={niche ?? null} />

        {creators.length === 0 ? (
          <Card padding="md">
            <EmptyState
              title="No creators match that filter"
              description="Try a different niche, or clear the filter to see everyone."
            />
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {creators.map((c) => (
              <CreatorCard
                key={c.user.id}
                creator={c}
                href={`/creator/collab/propose/${c.user.id}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({ Icon, title, description }: {
  Icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Card padding="md">
      <Icon className="h-5 w-5 text-brand" strokeWidth={1.5} />
      <h3 className="mt-3 text-base font-semibold tracking-tight text-fg">{title}</h3>
      <p className="mt-1 text-sm text-fg-muted leading-relaxed">{description}</p>
    </Card>
  );
}

function NicheFilter({ active }: { active: string | null }) {
  const items: { value: string | null; label: string }[] = [
    { value: null, label: 'All niches' },
    ...NICHES.slice(0, 15),
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        const isActive = active === item.value || (active === null && item.value === null);
        const href = item.value
          ? `/creator/projects/new/collab?niche=${encodeURIComponent(item.value)}`
          : '/creator/projects/new/collab';
        return (
          <Link
            key={String(item.value)}
            href={href}
            className={cn(
              'inline-flex items-center h-7 px-3 rounded-full text-xs font-medium transition-colors',
              isActive
                ? 'bg-brand text-brand-fg'
                : 'bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
