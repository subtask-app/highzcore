'use client';

// Action buttons specific to the collab state + viewer role. Lives in its
// own client island so the page above can stay server-rendered.

import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { Button, Card, Select, Textarea } from '@/components/ui';
import {
  acceptCollabAction,
  confirmCollabComplete,
  declineCollabAction,
} from '@/lib/collab/actions';

type State = 'proposed' | 'accepted' | 'declined' | 'completed';

interface Props {
  projectId: string;
  state: State;
  viewerIsProposer: boolean;
  viewerConfirmed: boolean;
  bothConfirmed: boolean;
}

export function CollabActionButtons({ projectId, state, viewerIsProposer, viewerConfirmed, bothConfirmed }: Props) {
  const [paymentMethod, setPaymentMethod] = useState('admin_credit');
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const accept = () => {
    setError(null);
    const form = new FormData();
    form.set('project_id', projectId);
    form.set('payment_method', paymentMethod);
    startTransition(async () => {
      const result = await acceptCollabAction(form);
      if (result && 'error' in result) setError(humanise(result.error));
    });
  };

  const decline = () => {
    setError(null);
    const form = new FormData();
    form.set('project_id', projectId);
    if (declineReason) form.set('reason', declineReason);
    startTransition(async () => {
      const result = await declineCollabAction(form);
      if (result && 'error' in result) setError(humanise(result.error));
    });
  };

  const confirm = () => {
    setError(null);
    const form = new FormData();
    form.set('project_id', projectId);
    startTransition(async () => {
      const result = await confirmCollabComplete(form);
      if (result && 'error' in result) setError(humanise(result.error));
    });
  };

  // proposed + viewer is the recipient → can accept/decline
  if (state === 'proposed' && !viewerIsProposer) {
    return (
      <Card padding="lg" className="space-y-4">
        <p className="text-sm font-semibold text-fg">Accept or decline?</p>
        <Select
          label="Payment method (your escrow)"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          options={[
            { value: 'flutterwave',     label: 'Card · Flutterwave (coming soon)' },
            { value: 'ccpayment',       label: 'USDT · CCPayment (coming soon)' },
            { value: 'direct_transfer', label: 'Direct bank transfer (coming soon)' },
            { value: 'admin_credit',    label: 'Test mode — accept with admin credit' },
          ]}
        />
        {showDecline ? (
          <div className="space-y-3">
            <Textarea
              label="Decline reason (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="Tell them why so they can adjust + try again."
            />
            <div className="flex gap-2">
              <Button onClick={decline} variant="danger" loading={pending}>Confirm decline</Button>
              <Button onClick={() => setShowDecline(false)} variant="ghost">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={accept} loading={pending} leftIcon={<Check className="h-4 w-4" />}>
              Accept + pay escrow
            </Button>
            <Button onClick={() => setShowDecline(true)} variant="secondary" leftIcon={<X className="h-4 w-4" />}>
              Decline
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  // proposed + viewer is the proposer → just waiting
  if (state === 'proposed' && viewerIsProposer) {
    return (
      <Card padding="md">
        <p className="text-sm text-fg-muted">
          Waiting for the other creator to accept or decline. You'll get a notification when they do.
        </p>
      </Card>
    );
  }

  // accepted → either side can confirm completion
  if (state === 'accepted') {
    if (viewerConfirmed) {
      return (
        <Card padding="md">
          <p className="text-sm text-fg-muted">
            You've confirmed completion. Waiting for the other side to confirm too.
          </p>
        </Card>
      );
    }
    return (
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-semibold text-fg">
          Once the collab is done, confirm completion here.
        </p>
        <p className="text-xs text-fg-muted">
          When both sides confirm, escrow is released and the collab is marked complete.
        </p>
        <div>
          <Button onClick={confirm} loading={pending} leftIcon={<Check className="h-4 w-4" />}>
            Confirm I've delivered my side
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card>
    );
  }

  if (state === 'completed' || bothConfirmed) {
    return (
      <Card padding="md" className="border-success/40">
        <p className="text-sm text-fg">Collab completed. Nice work.</p>
      </Card>
    );
  }

  if (state === 'declined') {
    return (
      <Card padding="md" className="border-neutral">
        <p className="text-sm text-fg-muted">This proposal was declined.</p>
      </Card>
    );
  }

  return null;
}

function humanise(code: string): string {
  switch (code) {
    case 'not_authenticated':  return 'Session expired. Log in again.';
    case 'project_required':   return 'Missing project id.';
    case 'not_your_proposal':  return 'This proposal isn\'t addressed to you.';
    case 'already_accepted':   return 'Already accepted.';
    case 'already_declined':   return 'Already declined.';
    case 'already_resolved':   return 'Already resolved.';
    case 'not_yet_accepted':   return "Can't confirm before both sides accept.";
    case 'match_not_found':    return 'Match not found.';
    case 'not_a_party':        return "You're not a party to this collab.";
    default:                   return `Something went wrong: ${code}.`;
  }
}
