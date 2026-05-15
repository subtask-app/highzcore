// Admin layout — auth + is_admin guard.

import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';
import { AdminShell } from '@/components/shells';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = serviceClient<Database>();
  const { data: u } = await admin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!u?.is_admin) redirect('/post-login');

  return <AdminShell>{children}</AdminShell>;
}
