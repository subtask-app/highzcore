/**
 * Client-side utility to verify YouTube subscription
 */

export interface VerificationResult {
  subscribed: boolean;
  message: string;
  taskId?: string;
  channelId?: string;
  error?: string;
}

/**
 * Verify if current user is subscribed to a channel
 * Call this from the client side (e.g., in a worker's dashboard)
 */
export async function verifySubscription(
  taskId: string,
  channelId: string
): Promise<VerificationResult> {
  try {
    const response = await fetch('/api/verify-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        channelId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        subscribed: false,
        message: data.error || 'Verification failed',
        error: data.error,
      };
    }

    return data;
  } catch (error: any) {
    return {
      subscribed: false,
      message: 'Network error',
      error: error.message,
    };
  }
}
