// Signed OAuth `state` parameter for the YouTube-grant flow.
//
// Before: state was the raw user id, so anyone could mint a grant against
// another user simply by guessing the id.
//
// Now: state is `base64url(payload).base64url(hmac)` with a TTL. We verify the
// HMAC on the callback and reject if the payload is older than the TTL.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_SECONDS = 10 * 60; // 10 minutes — covers user reading the consent screen.

export type GrantPlatform = 'web' | 'telegram';

interface StatePayload {
  uid: string;            // user id we're granting access for
  exp: number;            // unix-seconds expiry
  nonce: string;          // 16 random bytes (base64url) — prevents replay
  plat?: GrantPlatform;   // where the grant was initiated — drives the callback's UX
}

function secret(): string {
  // Prefer a dedicated secret; fall back to the service-role key so the system
  // still works if the operator forgets to set OAUTH_STATE_SECRET.
  const s = process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('Missing OAUTH_STATE_SECRET (or SUPABASE_SERVICE_ROLE_KEY fallback)');
  return s;
}

function b64urlEncode(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf;
  return b.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  return Buffer.from(s.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
}

function hmac(payload: string): string {
  return b64urlEncode(createHmac('sha256', secret()).update(payload).digest());
}

/** Mint a signed state for the given user id. Default TTL: 10 minutes. */
export function signState(
  uid: string,
  platform: GrantPlatform = 'web',
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  const payload: StatePayload = {
    uid,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    nonce: b64urlEncode(randomBytes(16)),
    plat: platform,
  };
  const json = JSON.stringify(payload);
  const enc = b64urlEncode(json);
  return `${enc}.${hmac(enc)}`;
}

export interface VerifyResult {
  ok: boolean;
  uid?: string;
  platform?: GrantPlatform;
  reason?: 'malformed' | 'bad_signature' | 'expired';
}

/** Verify a state. Returns `{ ok: true, uid, platform }` if valid, else a reason. */
export function verifyState(state: string | null | undefined): VerifyResult {
  if (!state || typeof state !== 'string' || !state.includes('.')) {
    return { ok: false, reason: 'malformed' };
  }
  const [enc, sig] = state.split('.', 2);
  if (!enc || !sig) return { ok: false, reason: 'malformed' };

  const expected = hmac(enc);
  // Constant-time comparison
  const a = b64urlDecode(sig);
  const b = b64urlDecode(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(b64urlDecode(enc).toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!payload?.uid || typeof payload.exp !== 'number') {
    return { ok: false, reason: 'malformed' };
  }
  if (Math.floor(Date.now() / 1000) > payload.exp) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, uid: payload.uid, platform: payload.plat ?? 'web' };
}
