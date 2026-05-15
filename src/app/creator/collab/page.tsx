// /creator/collab — my collabs hub. Three logical groups: proposals you
// received (act on them), proposals you sent (waiting), and active +
// completed.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Handshake, Users } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, LinkButton, ProductBadge } from '@/components/ui';
import { COLLAB_KIND_LABEL } from '@/lib/collab/pricing';
import { collabState, fetchMyCollabs, type MatchWithProject } from '@/lib/collab/queries';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '—';
}

const STATE_TONE = {
  proposed:  'warning' as const,
  accepted:  'info'    as const,
  completed: 'success' as const,
  declined:  'neutral' as const,
};

export default async function CreatorCollabHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const matches = await fetchMyCollabs(user.id);

  const incoming = matches.filter((m) => m.match.creator_b_id === user.id && collabState(m.match) === 'proposed');
  const sent = matches.filter((m) => m.match.creator_a_id === user.id && collabState(m.match) === 'proposed');
  const active = matches.filter((m) => collabState(m.match) === 'accepted');
  const done = matches.filter((m) => collabState(m.match) === 'completed' || collabState(m.match) === 'declined');

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <ProductBadge product="collab" size="md" />
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg mt-3">
            Collabs
          </h1>
          <p className="mt-2 text-sm md:text-base text-fg-muted">
            Proposals, accepted collabs, and history.
          </p>
        </div>
        <LinkButton href="/creator/projects/new/collab" leftIcon={<Users className="h-4 w-4" />}>
          Browse creators
        </LinkButton>
      </header>

      <Section title="Incoming proposals" hint={incoming.length === 0 ? 'Nothing waiting on you right now.' : 'Review and accept or decline.'}>
        {incoming.length === 0 ? null : <MatchList items={incoming} viewerId={user.id} />}
      </Section>

      <Section title="Proposals you sent" hint={sent.length === 0 ? "You haven't sent any proposals yet." : 'Waiting on the other creator to respond.'}>
        {sent.length === 0 ? null : <MatchList items={sent} viewerId={user.id} />}
      </Section>

      <Section title="Active collabs" hint={active.length === 0 ? 'No active collabs.' : 'Confirm completion when the collab is done.'}>
        {active.length === 0 ? null : <MatchList items={active} viewerId={user.id} />}
      </Section>

      <Section title="Past collabs" hint={done.length === 0 ? 'No history yet.' : undefined}>
        {done.length === 0 ? null : <MatchList items={done} viewerId={user.id} />}
      </Section>

      {matches.length === 0 && (
        <Card padding="md">
          <EmptyState
            icon={<Handshake className="h-7 w-7" strokeWidth={1.5} />}
            title="No collabs yet"
            description="Browse the directory and propose your first collab."
            action={<LinkButton href="/creator/projects/new/collab">Browse creators</LinkButton>}
          />
        </Card>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  if (!children) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{title}</h2>
      {hint && <p className="text-sm text-fg-muted">{hint}</p>}
      {children}
    </section>
  );
}

function MatchList({ items, viewerId }: { items: MatchWithProject[]; viewerId: string }) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      {items.map(({ match, counterparty }) => {
        const state = collabState(match);
        const youArePropser = match.creator_a_id === viewerId;
        const escrow = youArePropser ? match.escrow_a_usd : match.escrow_b_usd;
        return (
          <Link key={match.project_id} href={`/creator/collab/${match.project_id}`} className="block">
            <Card variant="interactive" padding="md" className="flex items-start gap-4">
              <Avatar
                src={counterparty?.profile.primary_channel_avatar_url ?? counterparty?.user.avatar_url ?? undefined}
                name={counterparty?.profile.business_name ?? counterparty?.user.full_name ?? '?'}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-fg truncate">
                      {counterparty?.profile.business_name ?? counterparty?.user.full_name ?? 'Creator'}
                    </p>
                    <p className="text-xs text-fg-subtle mt-0.5">
                      {COLLAB_KIND_LABEL[match.kind]} · ${Number(escrow).toFixed(0)} escrow ·{' '}
                      Proposed {fmtDate(match.proposed_at)}
                    </p>
                  </div>
                  <Badge tone={STATE_TONE[state]} size="sm">
                    {state.charAt(0).toUpperCase() + state.slice(1)}
                  </Badge>
                </div>
                {match.proposed_terms && (
                  <p className="mt-2 text-sm text-fg-muted line-clamp-2 leading-snug">
                    {match.proposed_terms}
                  </p>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-fg-subtle mt-1 shrink-0" />
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
