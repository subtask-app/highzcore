// Video preview card — shows the YouTube thumbnail, title, channel, and
// duration once the wizard has verified the URL.

import Image from 'next/image';
import { Check, Clock } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatDuration } from '@/lib/youtube/video-meta';

interface VideoMetaForPreview {
  title: string;
  channel_title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
}

export function VideoPreview({ meta }: { meta: VideoMetaForPreview }) {
  return (
    <Card padding="md" className="flex items-stretch gap-4">
      {meta.thumbnail_url ? (
        <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-md bg-surface-active">
          <Image
            src={meta.thumbnail_url}
            alt={meta.title}
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-24 w-40 shrink-0 rounded-md bg-surface-active" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-fg leading-snug line-clamp-2">{meta.title}</p>
        <p className="mt-1 text-sm text-fg-muted">{meta.channel_title}</p>
        <p className="mt-1 text-xs text-fg-subtle inline-flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(meta.duration_seconds)}
          </span>
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="h-3 w-3" /> Embeddable
          </span>
        </p>
      </div>
    </Card>
  );
}
