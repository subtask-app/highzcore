// Project card — used in the home page recent list and the full projects list.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, ProductBadge, productLabel } from '@/components/ui';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { ProjectRow } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProjectCard({ project, href }: { project: ProjectRow; href?: string }) {
  const link = href ?? `/creator/projects/${project.id}`;
  const collected = project.collected_response_count ?? 0;
  const target = project.target_response_count ?? 0;
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  return (
    <Link href={link} className="block">
      <Card variant="interactive" padding="md" className="flex items-start gap-4">
        <ProductBadge product={project.type} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-base font-semibold text-fg truncate">{project.title}</p>
              <p className="text-xs text-fg-subtle mt-0.5">
                {productLabel(project.type)} · Created {formatDate(project.created_at)}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          {/* Progress bar — only meaningful for products with task-style fulfillment. */}
          {target > 0 && project.type !== 'collab' && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-surface-active overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    project.status === 'completed' ? 'bg-success' : 'bg-brand',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-fg-muted tabular shrink-0">
                {collected}/{target}
              </span>
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-fg-subtle mt-1 shrink-0" />
      </Card>
    </Link>
  );
}
