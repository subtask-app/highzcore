// /creator/collab/propose/[targetId] — proposal form. Server-rendered shell
// fetches the target creator's preview; the form itself is a client island.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CreatorCard } from '@/components/collab/CreatorCard';
import { Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { fetchCreatorWithProfile } from '@/lib/collab/queries';
import { ProposalForm } from './ProposalForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ targetId: string }>;
}

export default async function ProposeCollabPage({ params }: PageProps) {
  const { targetId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (user.id === targetId) redirect('/creator/projects/new/collab');

  const target = await fetchCreatorWithProfile(targetId);
  if (!target) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/creator/projects/new/collab" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
          Propose a collab
        </h1>
        <p className="mt-2 text-sm md:text-base text-fg-muted">
          Spell out what you want to do together. They'll see this exactly as you write it.
        </p>
      </div>

      <CreatorCard creator={target} />

      <Card padding="lg">
        <ProposalForm targetId={targetId} />
      </Card>
    </div>
  );
}
