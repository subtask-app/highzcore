// /creator/billing — payment history (renamed from "wallet" since creators
// pay per project; there's no creator-side balance).

import { redirect } from 'next/navigation';
import { Receipt } from 'lucide-react';
import { Badge, Card, EmptyState, ProductBadge } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchPaymentHistory } from '@/lib/creator/queries';
import type { PaymentIntentStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<PaymentIntentStatus, string> = {
  pending:   'Pending',
  succeeded: 'Paid',
  failed:    'Failed',
  expired:   'Expired',
  refunded:  'Refunded',
};

const STATUS_TONE: Record<PaymentIntentStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending:   'warning',
  succeeded: 'success',
  failed:    'danger',
  expired:   'neutral',
  refunded:  'info',
};

const METHOD_LABEL: Record<string, string> = {
  flutterwave:     'Card · Flutterwave',
  ccpayment:       'USDT · CCPayment',
  direct_transfer: 'Bank transfer',
  admin_credit:    'Admin credit',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatUsd(n: number): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function CreatorBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const history = await fetchPaymentHistory(user.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Billing</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Every payment you've made on Highzcore.
        </p>
      </header>

      {history.length === 0 ? (
        <Card padding="md">
          <EmptyState
            icon={<Receipt className="h-7 w-7" strokeWidth={1.5} />}
            title="No payments yet"
            description="Once you launch a project, your receipts will appear here."
          />
        </Card>
      ) : (
        <Card padding="none">
          {/* Desktop: table. Mobile: stacked cards. */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle border-b border-border">
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.project_type && <ProductBadge product={p.project_type} size="sm" />}
                        <span className="text-fg font-medium truncate">{p.project_title ?? 'Project'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-fg-muted">{METHOD_LABEL[p.method] ?? p.method}</td>
                    <td className="px-6 py-4 text-right font-mono tabular text-fg">
                      {formatUsd(Number(p.amount_usd))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={STATUS_TONE[p.status]} size="sm">{STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-6 py-4 text-fg-muted">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-border">
            {history.map((p) => (
              <div key={p.id} className="px-4 py-4 flex items-start gap-3">
                {p.project_type && <ProductBadge product={p.project_type} size="md" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{p.project_title ?? 'Project'}</p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {METHOD_LABEL[p.method] ?? p.method} · {formatDate(p.created_at)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono tabular text-sm text-fg">{formatUsd(Number(p.amount_usd))}</p>
                  <Badge tone={STATUS_TONE[p.status]} size="xs" className="mt-1">{STATUS_LABEL[p.status]}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
