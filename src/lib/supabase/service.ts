// Service-role Supabase client for server-side code that needs to bypass RLS.
// NEVER expose this client in any code marked `'use client'`.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// We don't generate a `Database` generic from the schema yet, so calls are
// typed loosely. Cast results at the call site when you need stricter types.
type AnySupabaseClient = SupabaseClient<any, 'public', any>;

let cached: AnySupabaseClient | null = null;

export function serviceClient(): AnySupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Service client not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  cached = createClient<any, 'public', any>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
