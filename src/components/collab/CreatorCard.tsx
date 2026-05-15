// Card used in the collab directory + match preview. Shows another
// creator's channel info compactly.

import Link from 'next/link';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Avatar, Badge, Card } from '@/components/ui';
import type { DirectoryCreator } from '@/lib/collab/queries';

export function CreatorCard({ creator, href }: { creator: DirectoryCreator; href?: string }) {
  const inner = (
    <Card variant={href ? 'interactive' : 'resting'} padding="md" className="flex items-start gap-4 h-full">
      <Avatar
        src={creator.profile.primary_channel_avatar_url ?? creator.user.avatar_url ?? undefined}
        name={creator.profile.business_name ?? creator.user.full_name ?? '?'}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-fg truncate">
          {creator.profile.business_name ?? creator.user.full_name ?? 'Creator'}
        </p>
        {creator.profile.primary_channel_handle && (
          <p className="text-sm text-fg-muted truncate">@{creator.profile.primary_channel_handle}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {creator.profile.channel_niche && (
            <Badge tone="brand" size="xs">{creator.profile.channel_niche}</Badge>
          )}
          {creator.profile.subscriber_bracket && (
            <Badge tone="neutral" size="xs">{creator.profile.subscriber_bracket}</Badge>
          )}
          {creator.user.country && (
            <Badge tone="neutral" size="xs">{creator.user.country}</Badge>
          )}
        </div>
        {creator.profile.primary_channel_url && (
          <a
            href={creator.profile.primary_channel_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-2 text-xs text-fg-subtle hover:text-fg"
          >
            View channel <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {href && <ArrowRight className="h-4 w-4 text-fg-subtle mt-2 shrink-0" />}
    </Card>
  );
  if (href) {
    return <Link href={href} className="block">{inner}</Link>;
  }
  return inner;
}
