// Per-product project-creation flows live here. They're scaffolded in M4 as
// "coming soon" stubs — the real flows ship in M6 (Insights), M7 (ABTest),
// M8 (Promote), M9 (Collab). Boost is gated and stays a stub.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card, LinkButton, ProductBadge, productLabel, type Product } from '@/components/ui';

const VALID: Product[] = ['insights', 'abtest', 'promote', 'collab', 'boost'];

interface PageProps {
  params: Promise<{ product: string }>;
}

export default async function ProductCreatorStubPage({ params }: PageProps) {
  const { product } = await params;
  if (!VALID.includes(product as Product)) notFound();
  const p = product as Product;

  return (
    <div className="space-y-8 max-w-3xl">
      <Link href="/creator/projects/new" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="h-4 w-4" /> Back to product picker
      </Link>

      <div className="flex items-start gap-4">
        <ProductBadge product={p} size="xl" />
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-fg">
            {productLabel(p)}
          </h1>
          <p className="mt-2 text-sm md:text-base text-fg-muted leading-relaxed">
            Project creation for this product is being built.
          </p>
        </div>
      </div>

      <Card padding="lg" className="space-y-3">
        <p className="text-sm text-fg leading-relaxed">
          <strong>Coming soon.</strong> The full creation flow for {productLabel(p)} ships in an upcoming
          milestone. The platform, pricing, and worker pool are already wired up — only the
          creator-facing builder UI is pending.
        </p>
        <p className="text-sm text-fg-muted leading-relaxed">
          Want a heads-up when this lands? Email us at{' '}
          <a href="mailto:hello@highzcore.tech" className="text-brand font-semibold">hello@highzcore.tech</a>
          {' '}and we'll let you know.
        </p>
        <div className="pt-2">
          <LinkButton href="/creator" variant="secondary">Back to home</LinkButton>
        </div>
      </Card>
    </div>
  );
}
