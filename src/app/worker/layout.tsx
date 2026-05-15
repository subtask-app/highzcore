// Worker-section layout: auth + is_worker + onboarding guard.

import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';
import { WorkerShell } from '@/components/shells';
import { createClient } from '@/lib/supabase/server';
import { fetchWorkerContext } from '@/lib/worker/queries';

export const dynamic = 'force-dynamic';

export default async function WorkerLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await fetchWorkerContext(user.id);
  if (!ctx) redirect('/login');

  if (!ctx.user.is_worker) {
    redirect('/signup');
  }
  if (!ctx.profile?.onboarded_at) {
    redirect('/onboarding/worker');
  }

  return <WorkerShell>{children}</WorkerShell>;
}
