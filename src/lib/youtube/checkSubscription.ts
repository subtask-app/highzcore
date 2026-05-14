/**
 * Check if a user is subscribed to a specific YouTube channel
 *
 * @param userAccessToken - The user's Google OAuth access token (with YouTube scope)
 * @param channelId - The YouTube channel ID to check subscription for
 * @returns Promise<boolean> - True if subscribed, false otherwise
 */
export async function checkIfSubscribed(
  userAccessToken: string,
  channelId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?` +
      `part=snippet&mine=true&forChannelId=${channelId}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('YouTube API error:', error);
      throw new Error(`YouTube API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // If items array has any elements, user is subscribed
    return data.items && data.items.length > 0;
  } catch (error) {
    console.error('Error checking subscription:', error);
    throw error;
  }
}

/**
 * Get detailed subscription information
 *
 * @param userAccessToken - The user's Google OAuth access token
 * @param channelId - The YouTube channel ID
 * @returns Promise<SubscriptionInfo | null>
 */
export interface SubscriptionInfo {
  subscribed: boolean;
  subscribedAt?: string;
  channelTitle?: string;
  channelThumbnail?: string;
}

export async function getSubscriptionInfo(
  userAccessToken: string,
  channelId: string
): Promise<SubscriptionInfo> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/subscriptions?` +
      `part=snippet&mine=true&forChannelId=${channelId}`,
      {
        headers: {
          'Authorization': `Bearer ${userAccessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const subscription = data.items[0];
      return {
        subscribed: true,
        subscribedAt: subscription.snippet.publishedAt,
        channelTitle: subscription.snippet.title,
        channelThumbnail: subscription.snippet.thumbnails?.default?.url,
      };
    }

    return { subscribed: false };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    throw error;
  }
}

/**
 * Extract YouTube channel ID from a channel URL
 *
 * @param url - YouTube channel URL (e.g., https://www.youtube.com/@username or https://www.youtube.com/channel/UC...)
 * @returns string | null - The channel ID or null if not found
 */
export function extractChannelId(url: string): string | null {
  try {
    // Handle direct channel ID URLs: https://www.youtube.com/channel/UCxxxxxx
    const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }

    // For @username URLs, you'll need to resolve them to channel IDs using the YouTube API
    // This requires an additional API call to the channels endpoint
    const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    if (handleMatch) {
      // Return the handle - you'll need to resolve this separately
      return `@${handleMatch[1]}`;
    }

    return null;
  } catch (error) {
    console.error('Error extracting channel ID:', error);
    return null;
  }
}

/**
 * Resolve YouTube handle (@username) to channel ID
 * Requires API key or OAuth token
 */
export async function resolveHandleToChannelId(
  handle: string,
  apiKeyOrToken: string,
  useOAuth: boolean = false
): Promise<string | null> {
  try {
    const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;

    const headers: Record<string, string> = useOAuth
      ? { Authorization: `Bearer ${apiKeyOrToken}` }
      : {};

    const apiKeyParam = useOAuth ? '' : `&key=${apiKeyOrToken}`;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
      `part=id&forHandle=${cleanHandle}${apiKeyParam}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      return data.items[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error resolving handle to channel ID:', error);
    return null;
  }
}
