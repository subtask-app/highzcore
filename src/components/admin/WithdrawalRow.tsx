'use client';

// Admin row for processing a withdrawal: mark processing → enter tx hash →
// finalize, or fail with reason.

import { useState, useTransition } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { Badge, Button, Card, Input, Textarea } from '@/components/ui';
import {
  failWithdrawalAction,
  finalizeWithdrawalAction,
  markWithdrawalProcessingAction,
} from '@/lib/admin/actions';
import type { AdminWithdrawalRow } from '@/lib/admin/queries';

const STATUS_TONE: Record<string, 'warning' | 'info' | 'success' | 'danger' | 'neutral'> = {
  requested:  'warning',
  processing: 'info',
  completed:  'success',
  failed:     'danger',
  cancelled:  'neutral',
};

export function WithdrawalRow({ w }: { w: AdminWithdrawalRow }) {
  const [step, setStep] = useState<'idle' | 'finalize' | 'fail'>('idle');
  const [txHash, setTxHash] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const begin = () => {
    setError(null);
    startTransition(async () => {
      const r = await markWithdrawalProcessingAction(w.id);
      if ('error' in r) setError(r.error);
    });
  };
  const finalize = () => {
    if (txHash.length < 10) { setError('Tx hash looks too short.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await finalizeWithdrawalAction(w.id, txHash);
      if ('error' in r) setError(r.error);
    });
  };
  const fail = () => {
    if (reason.trim().length < 3) { setError('Reason required.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await failWithdrawalAction(w.id, reason);
      if ('error' in r) setError(r.error);
    });
  };

  return (
    <Card padding="md">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fg">
            ${Number(w.amount_usd).toFixed(2)} → {w.worker_name ?? w.worker_email ?? '—'}
          </p>
          <p className="text-xs text-fg-muted font-mono break-all">
            {w.destination_address}
          </p>
          {w.provider_tx_hash && (
            <a
              href={`https://tronscan.org/#/transaction/${w.provider_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-brand"
            >
              {w.provider_tx_hash.slice(0, 16)}… <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <Badge tone={STATUS_TONE[w.status]} size="sm">{w.status}</Badge>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {w.status === 'requested' && step === 'idle' && (
        <div className="mt-4 flex gap-2">
          <Button onClick={begin} loading={pending}>Mark processing</Button>
          <Button onClick={() => setStep('fail')} variant="secondary">Fail + refund</Button>
        </div>
      )}

      {w.status === 'processing' && step === 'idle' && (
        <div className="mt-4 flex gap-2 flex-wrap">
          <Button onClick={() => setStep('finalize')} leftIcon={<Check className="h-4 w-4" />}>
            Mark completed
          </Button>
          <Button onClick={() => setStep('fail')} variant="secondary" leftIcon={<X className="h-4 w-4" />}>
            Fail + refund
          </Button>
        </div>
      )}

      {step === 'finalize' && (
        <div className="mt-4 space-y-3">
          <Input
            label="On-chain tx hash"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="0x… or TronScan tx id"
          />
          <div className="flex gap-2">
            <Button onClick={finalize} loading={pending}>Finalize</Button>
            <Button onClick={() => setStep('idle')} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}

      {step === 'fail' && (
        <div className="mt-4 space-y-3">
          <Textarea
            label="Failure reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="What went wrong?"
          />
          <div className="flex gap-2">
            <Button onClick={fail} variant="danger" loading={pending}>Confirm fail + refund</Button>
            <Button onClick={() => setStep('idle')} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
