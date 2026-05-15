'use client';

// The client form for proposing a collab. Posts to proposeCollabAction.

import { useState, useTransition, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { Button, Card, Input, Select, Textarea } from '@/components/ui';
import {
  COLLAB_KIND_DESCRIPTION,
  COLLAB_KIND_LABEL,
  ESCROW_PRESETS,
  MAX_ESCROW_USD,
  MIN_ESCROW_USD,
  collabFeeBreakdown,
} from '@/lib/collab/pricing';
import { proposeCollabAction } from '@/lib/collab/actions';
import type { CollabKind } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface Props {
  targetId: string;
}

const KINDS: CollabKind[] = ['shoutout', 'joint_video', 'live_stream', 'channel_feature'];

export function ProposalForm({ targetId }: Props) {
  const [kind, setKind] = useState<CollabKind>('shoutout');
  const [terms, setTerms] = useState('');
  const [deadline, setDeadline] = useState('');
  const [escrowAmount, setEscrowAmount] = useState<number>(50);
  const [paymentMethod, setPaymentMethod] = useState<string>('admin_credit');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const breakdown = collabFeeBreakdown(escrowAmount);
  const valid =
    terms.trim().length >= 10 &&
    escrowAmount >= MIN_ESCROW_USD &&
    escrowAmount <= MAX_ESCROW_USD &&
    !pending;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!valid) {
      if (terms.trim().length < 10) setError('Write at least a sentence — the other creator needs context.');
      else if (escrowAmount < MIN_ESCROW_USD) setError(`Min escrow is $${MIN_ESCROW_USD}.`);
      else if (escrowAmount > MAX_ESCROW_USD) setError(`Max escrow is $${MAX_ESCROW_USD.toLocaleString()}.`);
      return;
    }
    const form = new FormData();
    form.set('target_id', targetId);
    form.set('kind', kind);
    form.set('proposed_terms', terms);
    if (deadline) form.set('agreed_deadline', deadline);
    form.set('escrow_amount', String(escrowAmount));
    form.set('payment_method', paymentMethod);

    startTransition(async () => {
      const result = await proposeCollabAction(form);
      if (result && 'error' in result) setError(humanise(result.error));
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Kind */}
      <FieldGroup label="Kind of collab" required>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className="w-full text-left"
            >
              <Card padding="sm" variant="interactive" className={cn('h-full', kind === k && 'ring-2 ring-brand')}>
                <p className="text-sm font-semibold text-fg flex items-center gap-2">
                  {kind === k && <Check className="h-3.5 w-3.5 text-brand" />}
                  {COLLAB_KIND_LABEL[k]}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted leading-relaxed">
                  {COLLAB_KIND_DESCRIPTION[k]}
                </p>
              </Card>
            </button>
          ))}
        </div>
      </FieldGroup>

      {/* Terms */}
      <Textarea
        label="Proposed terms"
        value={terms}
        onChange={(e) => setTerms(e.target.value)}
        rows={5}
        required
        placeholder="e.g. I'd like you to give my channel a 20-30 second shoutout in your next upload. I'll do the same for you in mine within a week. Mention this video URL: …"
        helper={`${terms.trim().length}/600 characters. Be specific — vague proposals get declined.`}
        maxLength={600}
      />

      {/* Deadline */}
      <Input
        type="date"
        label="Agreed deadline (optional)"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        helper="When you'd like the collab done by. Optional."
      />

      {/* Escrow */}
      <FieldGroup label="Escrow per side" required>
        <div className="flex flex-wrap gap-2">
          {ESCROW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setEscrowAmount(preset.amountUsd)}
              className={cn(
                'inline-flex items-center h-9 px-4 rounded-full border text-sm font-medium transition-colors',
                escrowAmount === preset.amountUsd
                  ? 'bg-brand-tint border-brand text-brand'
                  : 'bg-surface border-border text-fg-muted hover:bg-surface-hover hover:text-fg',
              )}
            >
              ${preset.amountUsd}
              {preset.highlight && <span className="ml-1 text-[10px] uppercase tracking-wider opacity-70">{preset.highlight}</span>}
            </button>
          ))}
        </div>
        <Input
          type="number"
          value={escrowAmount}
          onChange={(e) => setEscrowAmount(Math.max(0, Number(e.target.value) || 0))}
          min={MIN_ESCROW_USD}
          max={MAX_ESCROW_USD}
          step={5}
          aria-label="Custom escrow"
          fieldClassName="mt-2 max-w-xs"
        />
        <Card padding="md" className="bg-surface-hover space-y-1.5">
          <p className="text-xs text-fg-muted">
            You both pay <strong className="text-fg">${breakdown.escrowPerSide.toFixed(2)}</strong> into escrow.
          </p>
          <p className="text-xs text-fg-muted">
            Platform fee (15% per side): <strong className="text-fg">${breakdown.feePerSide.toFixed(2)}</strong> per creator.
          </p>
          <p className="text-xs text-fg-muted">
            On successful completion, you each get <strong className="text-fg">${breakdown.netReturnedPerSide.toFixed(2)}</strong>{' '}
            returned (treat this as a deposit, not a fee).
          </p>
        </Card>
      </FieldGroup>

      {/* Payment */}
      <Select
        label="Payment method (your escrow)"
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        options={[
          { value: 'flutterwave',     label: 'Card · Flutterwave (coming soon)' },
          { value: 'ccpayment',       label: 'USDT · CCPayment (coming soon)' },
          { value: 'direct_transfer', label: 'Direct bank transfer (coming soon)' },
          { value: 'admin_credit',    label: 'Test mode — auto-launch with admin credit' },
        ]}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" size="lg" fullWidth disabled={!valid} loading={pending}>
        Send proposal — pay ${escrowAmount} escrow
      </Button>
      <p className="text-xs text-fg-subtle text-center">
        The other creator can accept (and pay their matching escrow) or decline.
      </p>
    </form>
  );
}

function FieldGroup({ label, helper, required, children }: { label: string; helper?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-base font-semibold text-fg">{label}{required && <span className="text-danger ml-0.5">*</span>}</h2>
        {helper && <span className="text-xs text-fg-subtle">{helper}</span>}
      </div>
      {children}
    </div>
  );
}

function humanise(code: string): string {
  switch (code) {
    case 'target_required':       return 'Pick someone to propose to first.';
    case 'cannot_self_propose':   return "You can't propose a collab to yourself.";
    case 'target_not_creator':    return "They haven't enabled the creator role.";
    case 'kind_required':         return 'Pick a collab kind.';
    case 'terms_too_short':       return 'Write at least a sentence about what you want to do.';
    case 'escrow_invalid':        return `Escrow must be between $${MIN_ESCROW_USD} and $${MAX_ESCROW_USD.toLocaleString()}.`;
    case 'not_authenticated':     return 'Session expired. Log in again.';
    default:                      return `Something went wrong: ${code}.`;
  }
}
