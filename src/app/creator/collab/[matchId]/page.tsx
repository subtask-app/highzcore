// /creator/collab/[matchId] — collab match detail. Shows the proposal, the
// counterparty, the state, and the action buttons appropriate to who's
// viewing.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Clock, X } from 'lucide-react';
import { Badge, Card, ProductBadge } from '@/components/ui';
import { CreatorCard } from '@/components/collab/CreatorCard';
import { CollabActionButtons } from './CollabActionButtons';
import { createClient } from '@/lib/supabase/server';
import { collabState, fetchMatchById } from '@/lib/collab/queries';
import { COLLAB_KIND_LABEL, collabFeeBreakdown } from '@/lib/collab/pricing';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

function fmtDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
}

export default async function CollabMatchPage({ params }: PageProps) {
  const { matchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const mp = await fetchMatchById(matchId, user.id);
  if (!mp) notFound();

  const { match, project, counterparty } = mp;
  const state = collabState(match);
  const youArePropser = match.creator_a_id === user.id;
  const myEscrow = youArePropser ? match.escrow_a_usd : match.escrow_b_usd;
  const myConfirmed = youArePropser ? match.a_confirmed_complete : match.b_confirmed_complete;
  const theirConfirmed = youArePropser ? match.b_confirmed_complete : match.a_confirmed_complete;
  const breakdown = collabFeeBreakdown(Number(myEscrow));

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/creator/collab" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> All collabs
      </Link>

      <header className="flex items-start gap-3">
        <ProductBadge product="collab" size="md" />
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-fg">
            {project.title}
          </h1>
          <p className="mt-1 text-sm text-fg-muted inline-flex items-center gap-2 flex-wrap">
            <span>{COLLAB_KIND_LABEL[match.kind]}</span>
            <span aria-hidden>·</span>
            <Badge tone={state === 'declined' ? 'neutral' : state === 'completed' ? 'success' : state === 'accepted' ? 'info' : 'warning'}>
              {state.charAt(0).toUpperCase() + state.slice(1)}
            </Badge>
            <span aria-hidden>·</span>
            <span>Proposed {fmtDateTime(match.proposed_at)}</span>
          </p>
        </div>
      </header>

      {counterparty && (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">
            {youArePropser ? 'Proposed to' : 'From'}
          </h2>
          <CreatorCard creator={counterparty} />
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Terms</h2>
        <Card padding="md">
          <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{match.proposed_terms}</p>
          {match.agreed_deadline && (
            <p className="mt-3 text-xs text-fg-muted">
              Agreed deadline: <strong className="text-fg">{new Date(match.agreed_deadline).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </p>
          )}
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Money</h2>
        <Card padding="md" className="space-y-1.5">
          <Row k="Your escrow" v={`$${Number(myEscrow).toFixed(2)}`} />
          <Row k="Platform fee (15%)" v={`$${breakdown.feePerSide.toFixed(2)}`} />
          <Row k="Returned to you on completion" v={`$${breakdown.netReturnedPerSide.toFixed(2)}`} bold />
        </Card>
      </section>

      {state === 'accepted' && (
        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Completion</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <ConfirmCard label="You" confirmed={!!myConfirmed} />
            <ConfirmCard label="Them" confirmed={!!theirConfirmed} />
          </div>
        </section>
      )}

      {state === 'declined' && match.declined_reason && (
        <Card padding="md" className="border-danger/30">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-1">Decline reason</p>
          <p className="text-sm text-fg">{match.declined_reason}</p>
        </Card>
      )}

      <CollabActionButtons
        projectId={project.id}
        state={state}
        viewerIsProposer={youArePropser}
        viewerConfirmed={!!myConfirmed}
        bothConfirmed={!!myConfirmed && !!theirConfirmed}
      />
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${bold ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{k}</span>
      <span className={`text-sm tabular ${bold ? 'font-bold text-fg text-base' : 'text-fg'}`}>{v}</span>
    </div>
  );
}

function ConfirmCard({ label, confirmed }: { label: string; confirmed: boolean }) {
  return (
    <Card padding="md" className={confirmed ? 'border-success/40' : ''}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${confirmed ? 'bg-success text-paper' : 'bg-surface-active text-fg-muted'}`}>
          {confirmed ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold text-fg">{label}</p>
          <p className="text-xs text-fg-muted">{confirmed ? 'Confirmed complete' : 'Awaiting confirmation'}</p>
        </div>
      </div>
    </Card>
  );
}

// Suppress unused-import lint
void X;
