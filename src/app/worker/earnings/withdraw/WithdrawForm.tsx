'use client';

// Withdrawal form — client component because the server action returns
// validation errors we want to surface inline.

import { useState, useTransition, type FormEvent } from 'react';
import { Button, Card, Checkbox, Input } from '@/components/ui';
import { requestWithdrawalAction } from '@/lib/worker/actions';

interface Props {
  balance: number;
  savedAddress: string;
  fee: number;
}

export function WithdrawForm({ balance, savedAddress, fee }: Props) {
  const [amount, setAmount] = useState<string>('');
  const [address, setAddress] = useState<string>(savedAddress);
  const [saveAddress, setSaveAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const amountNum = Number(amount);
  const valid =
    Number.isFinite(amountNum) &&
    amountNum >= 10 &&
    amountNum <= balance &&
    address.trim().length >= 30;

  const net = Number.isFinite(amountNum) ? Math.max(0, amountNum - fee) : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) return;
    const form = new FormData();
    form.set('amount_usd', String(amountNum));
    form.set('destination_address', address.trim());
    if (saveAddress) form.set('save_address', 'on');

    startTransition(async () => {
      const result = await requestWithdrawalAction(form);
      if (result && 'error' in result) {
        setError(humanise(result.error));
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        type="number"
        label="Amount (USD)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={10}
        max={balance}
        step={0.01}
        required
        disabled={pending}
        placeholder="10.00"
        helper={`You'll receive $${net.toFixed(2)} after the $${fee.toFixed(2)} fee.`}
      />
      <Input
        label="USDT TRC20 address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
        disabled={pending}
        placeholder="T..."
        helper="Must be a valid TRC20 address (starts with T)."
      />
      {savedAddress !== address && (
        <Checkbox
          label="Save this as my default withdrawal address"
          checked={saveAddress}
          onChange={(e) => setSaveAddress(e.target.checked)}
          disabled={pending}
        />
      )}
      {error && (
        <Card padding="sm" className="border-danger/40 bg-[color-mix(in_srgb,var(--c-danger)_8%,transparent)]">
          <p className="text-sm text-danger">{error}</p>
        </Card>
      )}
      <Button type="submit" size="lg" fullWidth loading={pending} disabled={!valid}>
        Withdraw ${net.toFixed(2)}
      </Button>
    </form>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'min_10':              return 'Minimum withdrawal is $10.';
    case 'invalid_address':     return 'That doesn\'t look like a valid TRC20 address.';
    case 'insufficient_balance':return "You don't have enough in your available balance.";
    case 'not_authenticated':   return 'Your session expired. Log in again.';
    default:                    return `Something went wrong. Try again. (${code})`;
  }
}
