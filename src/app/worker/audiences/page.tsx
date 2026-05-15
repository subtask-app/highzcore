// /worker/audiences — link external accounts for the Promote product.
//
// MVP: each audience is added with `pending` status. Admins verify by
// looking at the proof + the live profile URL (auto-fetched follower
// count comes in M8).

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';
import { Badge, Card, EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchAudiences, fetchWorkerContext } from '@/lib/worker/queries';
import { AddAudienceForm } from './AddAudienceForm';
import { deleteAudienceAction } from '@/lib/worker/actions';
import type { AudiencePlatform, AudienceStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const PLATFORM_LABEL: Record<AudiencePlatform, string> = {
  twitter:          'X / Twitter',
  instagram:        'Instagram',
  tiktok:           'TikTok',
  telegram_channel: 'Telegram channel',
  whatsapp_group:   'WhatsApp group',
  facebook:         'Facebook',
  youtube:          'YouTube',
};

const STATUS_TONE: Record<AudienceStatus, 'warning' | 'success' | 'danger'> = {
  pending:  'warning',
  verified: 'success',
  rejected: 'danger',
};

export default async function WorkerAudiencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const audiences = await fetchAudiences(user.id);

  return (
    <div className="space-y-8">
      <Link href="/worker/settings" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Settings
      </Link>

      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Your audiences</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted max-w-xl">
          Link the social accounts where you have a real audience. These unlock Promote campaigns
          — you'll be matched with creators whose niche fits yours.
        </p>
      </header>

      {/* List */}
      {audiences.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<ExternalLink className="h-7 w-7" strokeWidth={1.5} />}
            title="No audiences linked yet"
            description="Add at least one to start receiving Promote campaign tasks."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border">
            {audiences.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 md:px-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg">
                    {PLATFORM_LABEL[a.platform]} · @{a.handle}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {a.verified_follower_count
                      ? `${a.verified_follower_count.toLocaleString()} followers`
                      : 'Pending verification'}
                    {a.profile_url && (
                      <>
                        {' · '}
                        <a className="text-brand hover:underline" href={a.profile_url} target="_blank" rel="noopener noreferrer">
                          profile ↗
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[a.status]} size="sm">{a.status}</Badge>
                <form action={async () => { 'use server'; await deleteAudienceAction(a.id); }}>
                  <button
                    type="submit"
                    aria-label="Delete audience"
                    className="text-fg-subtle hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg mb-3">Add an audience</h2>
        <AddAudienceForm />
      </div>
    </div>
  );
}
