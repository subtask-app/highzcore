import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface YouTubeAccessStatus {
  hasAccess: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check if the current user has granted YouTube access
 */
export function useYouTubeAccess(): YouTubeAccessStatus {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkYouTubeAccess();
  }, []);

  const checkYouTubeAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if user has google_token in database
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('google_token, youtube_access_granted')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // User has access if they have a google_token or youtube_access_granted flag
      setHasAccess(!!(data?.google_token || data?.youtube_access_granted));
      setLoading(false);

    } catch (err: any) {
      setError(err.message);
      setHasAccess(false);
      setLoading(false);
    }
  };

  return { hasAccess, loading, error };
}
