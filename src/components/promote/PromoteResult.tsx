// Promote campaign results panel. Renders the list of submitted shares
// grouped by status, with platform + post URL.

import { Badge, Card, EmptyState } from '@/components/ui';
import type { SubmittedShare } from '@/lib/promote/queries';
import type { AudiencePlatform, PromoteCampaignRow } from '@/lib/supabase/types';
import { ExternalLink } from 'lucide-react';

const PLATFORM_LABEL: Record<AudiencePlatform, string> = {
  twitter:          'X',
  instagram:        'Instagram',
  tiktok:           'TikTok',
  telegram_channel: 'Telegram',
  whatsapp_group:   'WhatsApp',
  facebook:         'Facebook',
  youtube:          'YouTube',
};

const STATUS_TONE = {
  submitted: 'warning' as const,
  approved:  'success' as const,
  rejected:  'danger' as const,
};

interface Props {
  campaign: PromoteCampaignRow;
  shares: SubmittedShare[];
  targetShareCount: number;
}

export function PromoteResult({ campaign, shares, targetShareCount }: Props) {
  const approved = shares.filter((s) => s.status === 'approved').length;
  const submitted = shares.filter((s) => s.status === 'submitted').length;
  const rejected = shares.filter((s) => s.status === 'rejected').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBlock label="Delivered" value={approved} />
        <StatBlock label="Awaiting review" value={submitted} />
        <StatBlock label="Rejected" value={rejected} />
        <StatBlock label="Target" value={targetShareCount} />
      </div>

      <Card padding="md" className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">
          UTM campaign
        </p>
        <p className="text-sm font-mono text-fg">{campaign.utm_campaign}</p>
        <p className="text-xs text-fg-muted leading-relaxed">
          Find these clicks in YouTube Studio under <strong>Reach → External</strong> — filter
          for source <code className="font-mono">highzcore</code>.
        </p>
      </Card>

      {shares.length === 0 ? (
        <Card padding="md">
          <EmptyState
            title="No shares yet"
            description="As workers post the video to their audiences, their submissions appear here for you to spot-check."
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-border">
            {shares.map((s) => (
              <div key={s.task_id} className="px-4 md:px-6 py-3 flex items-center gap-3">
                <Badge tone={STATUS_TONE[s.status]} size="sm" className="shrink-0">{s.status}</Badge>
                <span className="text-sm text-fg-muted shrink-0">
                  {s.platform ? PLATFORM_LABEL[s.platform] : '—'}
                </span>
                <a
                  href={s.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand truncate flex-1 hover:underline inline-flex items-center gap-1"
                >
                  {s.post_url || '(missing URL)'}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <span className="text-xs text-fg-subtle shrink-0">
                  {s.submitted_at && new Date(s.submitted_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="md">
      <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">{label}</p>
      <p className="mt-1 font-mono tabular text-2xl font-semibold text-fg">{value}</p>
    </Card>
  );
}
