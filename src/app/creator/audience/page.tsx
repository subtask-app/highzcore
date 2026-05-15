// /creator/audience — the channel manager. M4 ships one connected channel
// per creator (from onboarding). Multi-channel support is M10+ when admin
// tooling grows.

import { redirect } from 'next/navigation';
import { ExternalLink, RefreshCcw, Sparkles } from 'lucide-react';
import { Avatar, Badge, Card, EmptyState, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchCreatorContext } from '@/lib/creator/queries';

export const dynamic = 'force-dynamic';

export default async function CreatorAudiencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchCreatorContext(user.id);
  if (!ctx) redirect('/login');

  const channel = ctx.profile?.primary_channel_url
    ? {
        url: ctx.profile.primary_channel_url,
        id: ctx.profile.primary_channel_id,
        handle: ctx.profile.primary_channel_handle,
        avatar_url: ctx.profile.primary_channel_avatar_url,
        verified_at: ctx.profile.primary_channel_verified_at,
        niche: ctx.profile.channel_niche,
        bracket: ctx.profile.subscriber_bracket,
      }
    : null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
          Your audience
        </h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          The YouTube channel we tie studies, tests, and campaigns to.
        </p>
      </header>

      {!channel ? (
        <Card padding="md">
          <EmptyState
            icon={<Sparkles className="h-7 w-7" strokeWidth={1.5} />}
            title="No channel connected"
            description="Add and verify your YouTube channel so we can show you the right reports."
            action={<LinkButton href="/onboarding/creator">Connect your channel</LinkButton>}
          />
        </Card>
      ) : (
        <Card padding="lg">
          <div className="flex items-start gap-5">
            <Avatar src={channel.avatar_url ?? undefined} name={channel.handle ?? channel.url} size="2xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold tracking-tight text-fg">
                  {channel.handle ? `@${channel.handle}` : channel.url}
                </h2>
                {channel.verified_at && <Badge tone="success">Verified</Badge>}
              </div>
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-sm text-fg-muted hover:text-fg"
              >
                {channel.url} <ExternalLink className="h-3.5 w-3.5" />
              </a>

              <dl className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <Field label="Niche" value={channel.niche ?? '—'} />
                <Field label="Subscriber bracket" value={channel.bracket ?? '—'} />
                <Field label="Channel ID" value={channel.id ?? '—'} mono />
              </dl>

              <div className="mt-6 flex gap-2">
                <LinkButton href="/onboarding/creator" variant="secondary" leftIcon={<RefreshCcw className="h-4 w-4" />}>
                  Re-verify channel
                </LinkButton>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card padding="md" className="border-dashed">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-fg">Connect another channel</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Multi-channel support is coming. Need it now? Reach out and we'll set it up manually.
            </p>
          </div>
          <a href="mailto:hello@highzcore.tech" className="text-sm text-brand font-semibold">
            Email us
          </a>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</dt>
      <dd className={`mt-1 text-sm text-fg ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
