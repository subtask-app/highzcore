// POST /api/contracts/[id]/pin-instructions
//
// Pins a payment-instructions message at the top of a contract's chat thread.
// Called by the client dashboard right after a campaign is created.
//
//   * Reads bank details from server-side env vars (never exposed to the
//     browser bundle).
//   * Picks the first admin user as the sender — every admin in the system
//     can later respond on this thread.
//   * Idempotent via a dedupe check on `is_pinned + contract_id`.
//   * Requires the caller to be the contract's client (or an admin).

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

function paymentInstructionsBody(): string {
  const name      = process.env.BANK_ACCOUNT_NAME    ?? 'Highzcore';
  const number    = process.env.BANK_ACCOUNT_NUMBER  ?? '—';
  const bank      = process.env.BANK_NAME            ?? '—';
  const acctType  = process.env.BANK_ACCOUNT_TYPE    ?? 'Savings';
  const whatsapp  = process.env.WHATSAPP_NUMBER;

  const lines = [
    '👋 Welcome — here are the next steps to activate your campaign.',
    '',
    '🏦 PAYMENT DETAILS',
    `Account Name:    ${name}`,
    `Bank:            ${bank}`,
    `Account Number:  ${number}`,
    `Account Type:    ${acctType}`,
    '',
    '📌 HOW TO PROCEED',
    '1. Transfer the campaign total to the account above.',
    '2. Tap the 📎 attach button below and share a screenshot of the receipt.',
    '3. Reply here if anything is unclear — we usually respond in minutes.',
    '',
    'Once we confirm payment your campaign goes live and workers start verifying subscriptions to your channel automatically.',
  ];

  if (whatsapp) {
    lines.push('', `📱 Prefer WhatsApp? ${whatsapp}`);
  }

  return lines.join('\n');
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: contractId } = await ctx.params;

  // Auth: must be logged in.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = serviceClient();

  // Permission: caller must own the contract OR be an admin.
  const { data: contract, error: cErr } = await admin
    .from('contracts')
    .select('id, client_id')
    .eq('id', contractId)
    .maybeSingle() as { data: { id: string; client_id: string } | null; error: any };

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!contract) return NextResponse.json({ error: 'contract_not_found' }, { status: 404 });

  if (contract.client_id !== user.id) {
    const { data: caller } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role: string } | null };
    if (caller?.role !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  // Idempotency: don't pin twice.
  const { data: existing } = await admin
    .from('messages')
    .select('id')
    .eq('contract_id', contractId)
    .eq('is_pinned', true)
    .eq('sender_role', 'admin')
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ pinned: true, already: true });
  }

  // Need a real admin user id to satisfy the FK on messages.sender_id.
  const { data: firstAdmin } = await admin
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle() as { data: { id: string } | null };

  if (!firstAdmin) {
    return NextResponse.json(
      { error: 'no_admin_user', message: 'No admin user exists yet — promote one first via seed.sql.' },
      { status: 503 },
    );
  }

  const { error: msgErr } = await admin.from('messages').insert({
    contract_id: contractId,
    sender_id: firstAdmin.id,
    sender_role: 'admin',
    message: paymentInstructionsBody(),
    is_pinned: true,
  });

  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ pinned: true });
}
