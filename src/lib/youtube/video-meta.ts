// Video metadata resolver — given a YouTube video URL / id, return the
// canonical info (title, duration, thumbnail, channel, view + like count).
//
// Used by the Insights, ABTest, Promote, and Boost creation wizards to
// preview the target video the creator pasted, and to cache duration on
// the projects table.

import { extractVideoId } from './channel-meta';

const YT_API = 'https://www.googleapis.com/youtube/v3';

export interface VideoMeta {
  id: string;
  title: string;
  description: string;
  channel_id: string;
  channel_title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  duration_iso: string;        // PT4M37S, etc.
  published_at: string;
  view_count: number | null;
  like_count: number | null;
  privacy_status: string;
}

export type VideoLookupError =
  | { code: 'no_api_key' }
  | { code: 'invalid_input'; reason: string }
  | { code: 'not_found' }
  | { code: 'private_or_blocked'; reason: string }
  | { code: 'api_error'; status: number; message: string };

// Parse the ISO-8601 duration (e.g. "PT4M37S") into seconds.
export function parseIsoDuration(iso: string): number {
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const [, days, hours, minutes, seconds] = m;
  return (
    Number(days ?? 0) * 86400 +
    Number(hours ?? 0) * 3600 +
    Number(minutes ?? 0) * 60 +
    Number(seconds ?? 0)
  );
}

// Render seconds as a compact label: 4:37, 1:04:37.
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '–';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export async function resolveVideoMeta(
  input: string,
): Promise<{ ok: true; meta: VideoMeta } | { ok: false; error: VideoLookupError }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { ok: false, error: { code: 'no_api_key' } };

  const id = extractVideoId(input.trim());
  if (!id) {
    return { ok: false, error: { code: 'invalid_input', reason: 'not a video URL or id' } };
  }

  try {
    const url = `${YT_API}/videos?part=snippet,contentDetails,statistics,status&id=${id}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      return { ok: false, error: { code: 'api_error', status: res.status, message: 'youtube' } };
    }
    type Item = {
      id: string;
      snippet: {
        title: string;
        description: string;
        channelId: string;
        channelTitle: string;
        publishedAt: string;
        thumbnails?: {
          default?: { url: string };
          medium?: { url: string };
          high?: { url: string };
          maxres?: { url: string };
        };
      };
      contentDetails: { duration: string };
      statistics: { viewCount?: string; likeCount?: string };
      status: { privacyStatus: string; embeddable?: boolean };
    };
    const json = (await res.json()) as { items?: Item[] };
    const item = json.items?.[0];
    if (!item) return { ok: false, error: { code: 'not_found' } };

    if (item.status.privacyStatus !== 'public' || item.status.embeddable === false) {
      return {
        ok: false,
        error: {
          code: 'private_or_blocked',
          reason:
            item.status.privacyStatus !== 'public'
              ? `Video is ${item.status.privacyStatus}.`
              : 'Embedding is disabled on this video.',
        },
      };
    }

    const thumb = item.snippet.thumbnails ?? {};
    const thumbnail =
      thumb.maxres?.url ?? thumb.high?.url ?? thumb.medium?.url ?? thumb.default?.url ?? null;

    return {
      ok: true,
      meta: {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channel_id: item.snippet.channelId,
        channel_title: item.snippet.channelTitle,
        thumbnail_url: thumbnail,
        duration_seconds: parseIsoDuration(item.contentDetails.duration),
        duration_iso: item.contentDetails.duration,
        published_at: item.snippet.publishedAt,
        view_count: item.statistics.viewCount ? Number(item.statistics.viewCount) : null,
        like_count: item.statistics.likeCount ? Number(item.statistics.likeCount) : null,
        privacy_status: item.status.privacyStatus,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: { code: 'api_error', status: 0, message } };
  }
}
