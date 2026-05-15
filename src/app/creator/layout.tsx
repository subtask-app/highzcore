// Creator-section layout: every page under /creator runs through this guard.
//
// Guards:
//   1. Must be authenticated
//   2. Must have is_creator = true (else add-role redirect via /signup)
//   3. Must have completed creator onboarding (else /onboarding/creator)

import { redirect } from 'next/navigation';
import { type ReactNode } from 'react';
import { CreatorShell } from '@/components/shells';
import { createClient } from '@/lib/supabase/server';
import { fetchCreatorContext } from '@/lib/creator/queries';

export const dynamic = 'force-dynamic';

export default async function CreatorLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const ctx = await fetchCreatorContext(user.id);
  if (!ctx) redirect('/login');

  if (!ctx.user.is_creator) {
    // Logged-in user with no creator role — push them to the chooser.
    redirect('/signup');
  }
  if (!ctx.profile?.onboarded_at) {
    redirect('/onboarding/creator');
  }

  return <CreatorShell>{children}</CreatorShell>;
}
