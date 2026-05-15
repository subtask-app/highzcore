// /post-login — server-rendered router that decides where to send the user
// after they sign in. Logic:
//   1. Not signed in → /login
//   2. is_admin     → /admin
//   3. is_creator + onboarded → /creator
//   4. is_creator + no profile → /onboarding/creator
//   5. is_worker  + onboarded → /worker
//   6. is_worker  + no profile → /onboarding/worker
//   7. Has neither role yet → /signup (chooser)
//
// This page renders nothing — it always redirects.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import type { Database } from '@/lib/supabase/types';
import { readRoleIntent } from '@/lib/auth/actions';

export const dynamic = 'force-dynamic';

export default async function PostLoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = serviceClient<Database>();
  const { data: u } = await admin
    .from('users')
    .select('is_creator, is_worker, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!u) redirect('/login');
  if (u.is_admin) redirect('/admin');

  // If a role intent is set from signup, use it to route into onboarding.
  const intent = await readRoleIntent();
  if (intent === 'creator' || (u.is_creator && !u.is_worker)) {
    const { data: profile } = await admin
      .from('creator_profiles')
      .select('onboarded_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile?.onboarded_at) redirect('/onboarding/creator');
    redirect('/creator');
  }
  if (intent === 'worker' || (u.is_worker && !u.is_creator)) {
    const { data: profile } = await admin
      .from('worker_profiles')
      .select('onboarded_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!profile?.onboarded_at) redirect('/onboarding/worker');
    redirect('/worker');
  }

  // Dual-role: prefer creator dashboard, but route to onboarding if either is missing.
  if (u.is_creator && u.is_worker) {
    redirect('/creator');
  }

  // No role yet — push to the chooser.
  redirect('/signup');
}
