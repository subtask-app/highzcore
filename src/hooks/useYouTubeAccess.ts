'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface YouTubeAccessStatus {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Source of truth: `users.youtube_access_granted`.
 *
 * We deliberately do NOT inspect `google_token` here — that column is only
 * populated by the YouTube-grant flow (see auth/youtube-callback), and a
 * stale/expired token shouldn't gate the UI. The flag is what gets set
 * alongside the token write, so it's a clean binary state.
 */
export function useYouTubeAccess(): YouTubeAccessStatus {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasAccess(false);
        return;
      }
      const { data, error: fetchErr } = await supabase
        .from('users')
        .select('youtube_access_granted')
        .eq('id', user.id)
        .single();
      if (fetchErr) {
        setError(fetchErr.message);
        setHasAccess(false);
        return;
      }
      setHasAccess(Boolean((data as { youtube_access_granted?: boolean } | null)?.youtube_access_granted));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to check YouTube access');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  return { hasAccess, loading, error, refresh: check };
}
