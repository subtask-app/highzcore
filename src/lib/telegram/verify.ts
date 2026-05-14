// Verify Telegram Mini App initData signatures.
//
// Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// Algorithm:
//   1. Parse the URL-encoded initData string into key/value pairs.
//   2. Remove the `hash` field, sort the rest by key, join with `\n` as
//      "key=value" → that's the data-check-string.
//   3. secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)
//   4. signature = HMAC_SHA256(key=secret_key, data=data-check-string)
//   5. Verify signature == hash.
//
// We also enforce a max age so an old initData can't be replayed indefinitely.

import { createHmac, timingSafeEqual } from 'crypto';

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface VerifiedInitData {
  user: TelegramUser;
  auth_date: number;
  start_param?: string; // referral / deep-link payload
  raw: URLSearchParams;
}

const MAX_AGE_SECONDS = 60 * 60; // 1 hour — Telegram's recommended ceiling

export function verifyInitData(initData: string, botToken: string): VerifiedInitData {
  if (!initData) throw new Error('initData_missing');
  if (!botToken) throw new Error('bot_token_not_configured');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new Error('hash_missing');

  // Build the data-check-string.
  const entries: [string, string][] = [];
  params.forEach((value, key) => {
    if (key !== 'hash') entries.push([key, value]);
  });
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  // HMAC.
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error('hash_mismatch');
  }

  // Age check.
  const authDate = Number(params.get('auth_date'));
  if (!authDate) throw new Error('auth_date_missing');
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > MAX_AGE_SECONDS) {
    throw new Error('initdata_expired');
  }

  // Parse user payload.
  const userJson = params.get('user');
  if (!userJson) throw new Error('user_missing');
  let user: TelegramUser;
  try {
    user = JSON.parse(userJson) as TelegramUser;
  } catch {
    throw new Error('user_parse_failed');
  }
  if (!user.id) throw new Error('user_id_missing');

  return {
    user,
    auth_date: authDate,
    start_param: params.get('start_param') ?? undefined,
    raw: params,
  };
}
