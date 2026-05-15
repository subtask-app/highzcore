// /worker/earnings/withdraw — withdrawal flow. Server-rendered to read the
// worker's saved USDT address + current balance, then a client form to
// submit. Posts to the request_withdrawal RPC via server action.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchWorkerContext } from '@/lib/worker/queries';
import { WithdrawForm } from './WithdrawForm';

export const dynamic = 'force-dynamic';

export default async function WorkerWithdrawPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const ctx = await fetchWorkerContext(user.id);
  if (!ctx?.profile) redirect('/login');

  const balance = Number(ctx.profile.earnings_balance);
  const fee = 1.00; // matches schema.sql: request_withdrawal flat fee

  return (
    <div className="space-y-6 max-w-xl">
      <Link href="/worker/earnings" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to earnings
      </Link>

      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">Withdraw to USDT</h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          We send USDT on the TRON network (TRC20). Make sure your address supports TRC20 — sending
          to an ERC20-only address will lose the funds.
        </p>
      </div>

      <Card padding="lg" className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle">Available balance</span>
          <span className="font-mono tabular text-xl font-semibold text-fg">${balance.toFixed(2)}</span>
        </div>
        <p className="text-xs text-fg-muted">Minimum withdrawal: $10. Flat fee: ${fee.toFixed(2)} (network + provider).</p>
      </Card>

      <WithdrawForm
        balance={balance}
        savedAddress={ctx.profile.usdt_trc20_address ?? ''}
        fee={fee}
      />

      <p className="text-xs text-fg-subtle leading-relaxed">
        Once the network confirms (usually under 5 minutes), the transaction id appears in your{' '}
        earnings history. If something goes wrong, your balance is refunded automatically.
      </p>
    </div>
  );
}
