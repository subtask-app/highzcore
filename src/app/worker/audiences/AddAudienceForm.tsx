'use client';

// Client form to add an audience. Posts to the addAudienceAction server action.

import { useState, useTransition, type FormEvent } from 'react';
import { Button, Card, Input, Select } from '@/components/ui';
import { addAudienceAction } from '@/lib/worker/actions';

export function AddAudienceForm() {
  const [platform, setPlatform] = useState('');
  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [followers, setFollowers] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = new FormData();
    form.set('platform', platform);
    form.set('handle', handle.trim());
    form.set('profile_url', profileUrl.trim());
    form.set('verified_follower_count', followers);
    startTransition(async () => {
      const result = await addAudienceAction(form);
      if (result && 'error' in result) {
        setError(humanise(result.error));
        return;
      }
      setInfo('Added. We\'ll verify within 24h and notify you on Telegram.');
      setPlatform('');
      setHandle('');
      setProfileUrl('');
      setFollowers('');
    });
  };

  return (
    <Card padding="lg">
      <form onSubmit={submit} className="space-y-4">
        <Select
          label="Platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          options={[
            { value: 'twitter',          label: 'X / Twitter' },
            { value: 'instagram',        label: 'Instagram' },
            { value: 'tiktok',           label: 'TikTok' },
            { value: 'telegram_channel', label: 'Telegram channel' },
            { value: 'whatsapp_group',   label: 'WhatsApp group' },
            { value: 'facebook',         label: 'Facebook' },
            { value: 'youtube',          label: 'YouTube' },
          ]}
          placeholder="Pick a platform"
          required
          disabled={pending}
        />
        <Input
          label="Handle"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="yourname"
          required
          disabled={pending}
        />
        <Input
          label="Profile URL (optional)"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          type="url"
          placeholder="https://…"
          disabled={pending}
        />
        <Input
          label="Followers / members (optional)"
          value={followers}
          onChange={(e) => setFollowers(e.target.value)}
          type="number"
          min={0}
          step={1}
          placeholder="500"
          helper="We verify this ourselves — feel free to skip."
          disabled={pending}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-success">{info}</p>}
        <Button type="submit" loading={pending} fullWidth>
          Add audience
        </Button>
      </form>
    </Card>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'platform_required': return 'Pick a platform.';
    case 'handle_required':   return 'Handle is required.';
    case 'duplicate':         return 'You already added that handle for that platform.';
    case 'not_authenticated': return 'Your session expired. Log in again.';
    default:                  return `Something went wrong. (${code})`;
  }
}
