'use client';

// Inline form to update the saved USDT TRC20 withdrawal address.

import { useState, useTransition, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { updateUsdtAddressAction } from '@/lib/worker/actions';

export function UsdtAddressForm({ initial }: { initial: string }) {
  const [address, setAddress] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = address.trim() !== initial.trim();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (address.trim().length < 30) {
      setError('That doesn\'t look like a valid TRC20 address.');
      return;
    }
    startTransition(async () => {
      const result = await updateUsdtAddressAction(address);
      if (result && 'error' in result) {
        setError(result.error === 'invalid_address' ? 'Invalid TRC20 address.' : result.error);
        return;
      }
      setInfo('Saved.');
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="T..."
        disabled={pending}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!dirty || pending} loading={pending} size="sm">
          Save
        </Button>
        {error && <span className="text-sm text-danger">{error}</span>}
        {info && <span className="text-sm text-success">{info}</span>}
      </div>
    </form>
  );
}
