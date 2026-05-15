// Channel metadata resolver — given a YouTube channel URL or @handle, hit the
// public YouTube Data API v3 with our server-side API key and return the
// canonical channel id, handle, title, avatar, and subscriber count.
//
// We use this:
//   - During creator onboarding, to preview "is this you?" before saving.
//   - To populate creator_profiles.primary_channel_id once verified.
//   - For sanity-checking video URLs (separate helper below).
//
// Errors carry a short machine-readable code; the UI translates.

// ── Inputs we accept ───────────────────────────────────────────────────────
// We accept any of:
//   https://youtube.com/@handle
//   https://www.youtube.com/@handle
//   https://youtube.com/channel/UCxxxxx
//   https://youtube.com/c/customName  (legacy custom URL)
//   https://youtube.com/user/userName (legacy username URL)
//   @handle      (bare)
//   UCxxxxx...   (bare channel id)
//   channelName  (best-effort search)

const YT_API = 'https://www.googleapis.com/youtube/v3';

export interface ChannelMeta {
  id: string;          // UCxxxxxxxxxxxxxxxxxx
  title: string;
  handle: string | null;
  description: string;
  avatar_url: string | null;
  subscriber_count: number | null;
  video_count: number | null;
  view_count: number | null;
  country: string | null;
  custom_url: string | null;
}

export type ChannelLookupError =
  | { code: 'no_api_key' }
  | { code: 'invalid_input'; reason: string }
  | { code: 'not_found' }
  | { code: 'api_error'; status: number; message: string };

function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY ?? null;
}

function extractHandle(input: string): string | null {
  // Accept "@handle" or paths ending in "/@handle".
  const m = input.match(/(?:^|\/)@([A-Za-z0-9_.-]{3,})/);
  return m ? m[1] : null;
}

function extractChannelId(input: string): string | null {
  // 24 chars, starts with UC.
  const m = input.match(/UC[A-Za-z0-9_-]{22}/);
  return m ? m[0] : null;
}

function extractLegacyName(input: string): { type: 'c' | 'user'; name: string } | null {
  const m = input.match(/\/(c|user)\/([A-Za-z0-9_-]+)/);
  return m ? { type: m[1] as 'c' | 'user', name: m[2] } : null;
}

// ── Resolve any input to a channel id ──────────────────────────────────────
async function resolveChannelId(input: string, apiKey: string): Promise<string | null> {
  const trimmed = input.trim();

  const direct = extractChannelId(trimmed);
  if (direct) return direct;

  const handle = extractHandle(trimmed);
  if (handle) {
    // /channels?forHandle=@x — newest API form, exact match.
    const url = `${YT_API}/channels?part=id&forHandle=${encodeURIComponent('@' + handle)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`yt_channels_${res.status}`);
    const json = (await res.json()) as { items?: { id: string }[] };
    return json.items?.[0]?.id ?? null;
  }

  const legacy = extractLegacyName(trimmed);
  if (legacy?.type === 'user') {
    const url = `${YT_API}/channels?part=id&forUsername=${encodeURIComponent(legacy.name)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`yt_channels_${res.status}`);
    const json = (await res.json()) as { items?: { id: string }[] };
    return json.items?.[0]?.id ?? null;
  }

  // Fall back to search — flaky and quota-expensive, but covers stragglers.
  const term = legacy?.name ?? trimmed.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  if (!term) return null;
  const url = `${YT_API}/search?part=snippet&type=channel&q=${encodeURIComponent(term)}&maxResults=1&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`yt_search_${res.status}`);
  const json = (await res.json()) as { items?: { snippet: { channelId: string } }[] };
  return json.items?.[0]?.snippet.channelId ?? null;
}

// ── Fetch full channel detail by id ────────────────────────────────────────
async function fetchChannelById(id: string, apiKey: string): Promise<ChannelMeta | null> {
  const url = `${YT_API}/channels?part=snippet,statistics,brandingSettings&id=${id}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`yt_channels_${res.status}`);
  type Item = {
    id: string;
    snippet: {
      title: string;
      description: string;
      country?: string;
      customUrl?: string;
      thumbnails?: { default?: { url: string }; medium?: { url: string }; high?: { url: string } };
    };
    statistics: {
      viewCount?: string;
      subscriberCount?: string;
      hiddenSubscriberCount?: boolean;
      videoCount?: string;
    };
  };
  const json = (await res.json()) as { items?: Item[] };
  const item = json.items?.[0];
  if (!item) return null;
  const thumb = item.snippet.thumbnails ?? {};
  const avatar = thumb.high?.url ?? thumb.medium?.url ?? thumb.default?.url ?? null;
  return {
    id: item.id,
    title: item.snippet.title,
    handle: item.snippet.customUrl ?? null,
    description: item.snippet.description,
    avatar_url: avatar,
    subscriber_count: item.statistics.hiddenSubscriberCount
      ? null
      : item.statistics.subscriberCount
        ? Number(item.statistics.subscriberCount)
        : null,
    video_count: item.statistics.videoCount ? Number(item.statistics.videoCount) : null,
    view_count: item.statistics.viewCount ? Number(item.statistics.viewCount) : null,
    country: item.snippet.country ?? null,
    custom_url: item.snippet.customUrl ?? null,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────
export async function resolveChannelMeta(
  input: string,
): Promise<{ ok: true; meta: ChannelMeta } | { ok: false; error: ChannelLookupError }> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: { code: 'no_api_key' } };
  if (!input || input.trim().length < 2) {
    return { ok: false, error: { code: 'invalid_input', reason: 'empty' } };
  }

  try {
    const id = await resolveChannelId(input, apiKey);
    if (!id) return { ok: false, error: { code: 'not_found' } };

    const meta = await fetchChannelById(id, apiKey);
    if (!meta) return { ok: false, error: { code: 'not_found' } };

    return { ok: true, meta };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    return { ok: false, error: { code: 'api_error', status: 0, message } };
  }
}

// ── Bonus: extract the video id from a YouTube video URL ───────────────────
// Used for Insights/ABTest/Promote/Boost projects.
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  // youtu.be/<id>
  let m = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // youtube.com/watch?v=<id>
  m = trimmed.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // youtube.com/shorts/<id> or /live/<id> or /embed/<id>
  m = trimmed.match(/youtube\.com\/(?:shorts|live|embed)\/([A-Za-z0-9_-]{11})/);
  if (m) return m[1];
  // Bare id
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}
