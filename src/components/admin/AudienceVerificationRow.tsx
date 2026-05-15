'use client';

// Inline row + actions for an audience pending verification.

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Check, ExternalLink, X } from 'lucide-react';
import { Badge, Button, Card, Input, Textarea } from '@/components/ui';
import { rejectAudienceAction, verifyAudienceAction } from '@/lib/admin/actions';
import type { AdminAudienceRow } from '@/lib/admin/queries';

const PLATFORM_LABEL: Record<string, string> = {
  twitter:          'X / Twitter',
  instagram:        'Instagram',
  tiktok:           'TikTok',
  telegram_channel: 'Telegram channel',
  whatsapp_group:   'WhatsApp group',
  facebook:         'Facebook',
  youtube:          'YouTube',
};

export function AudienceVerificationRow({ audience }: { audience: AdminAudienceRow }) {
  const [followers, setFollowers] = useState<string>(String(audience.verified_follower_count ?? ''));
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const verify = () => {
    const n = followers ? Number(followers) : undefined;
    if (followers && !Number.isFinite(n)) { setError('Followers must be a number.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await verifyAudienceAction(audience.id, n);
      if ('error' in r) setError(r.error);
    });
  };
  const reject = () => {
    if (reason.trim().length < 3) { setError('Reason required.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await rejectAudienceAction(audience.id, reason);
      if ('error' in r) setError(r.error);
    });
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg">
            {PLATFORM_LABEL[audience.platform] ?? audience.platform} · @{audience.handle}
          </p>
          <p className="text-xs text-fg-muted">
            {audience.worker_name ?? audience.worker_email ?? '—'} · self-reported{' '}
            {audience.verified_follower_count?.toLocaleString() ?? '?'} followers
          </p>
          {audience.profile_url && (
            <a
              href={audience.profile_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-brand"
            >
              Profile <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Badge tone="warning" size="sm">Pending</Badge>
      </div>

      {audience.verification_evidence_url && (
        <div className="mt-3">
          <a href={audience.verification_evidence_url} target="_blank" rel="noopener noreferrer" className="block">
            <Image
              src={audience.verification_evidence_url}
              alt="Evidence"
              width={240}
              height={160}
              className="rounded-md border border-border object-cover"
            />
          </a>
        </div>
      )}

      {showReject ? (
        <div className="mt-4 space-y-3">
          <Textarea
            label="Reject reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why aren't we verifying this?"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={reject} variant="danger" loading={pending}>Confirm reject</Button>
            <Button onClick={() => setShowReject(false)} variant="ghost">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <Input
            label="Verified follower count (optional)"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            type="number"
            min={0}
            helper="Override the worker's self-reported number with what you actually see."
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={verify} loading={pending} leftIcon={<Check className="h-4 w-4" />}>Verify</Button>
            <Button onClick={() => setShowReject(true)} variant="secondary" leftIcon={<X className="h-4 w-4" />}>Reject</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
