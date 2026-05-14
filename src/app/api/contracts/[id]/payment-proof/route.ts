// POST /api/contracts/[id]/payment-proof
//
// Records a payment-proof screenshot for a pending contract.
//   * Stamps contracts.payment_proof_url
//   * Posts a client-side chat message with the image attached so the admin
//     sees it in the same thread as the pinned instructions.
//
// The contract does NOT auto-activate — that's a deliberate admin action,
// since we still want a human to confirm the bank deposit.
//
// Body: { url: string }

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

interface Body {
  url?: string;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: contractId } = await ctx.params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const url = body?.url?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: 'bad_url' }, { status: 400 });
  }

  const admin = serviceClient();

  // Verify the caller owns this contract.
  const { data: contract, error: cErr } = await admin
    .from('contracts')
    .select('id, client_id, status')
    .eq('id', contractId)
    .maybeSingle() as { data: { id: string; client_id: string; status: string } | null; error: any };

  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  if (!contract) return NextResponse.json({ error: 'contract_not_found' }, { status: 404 });
  if (contract.client_id !== user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Stamp the contract.
  const { error: updErr } = await admin
    .from('contracts')
    .update({ payment_proof_url: url })
    .eq('id', contractId);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Post the proof into the chat thread as the client.
  const { error: msgErr } = await admin.from('messages').insert({
    contract_id: contractId,
    sender_id: user.id,
    sender_role: 'client',
    message: 'Payment proof attached. 📎',
    media_url: url,
    media_type: 'image',
  });
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
