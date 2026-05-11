import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkIfSubscribed } from '@/lib/youtube/checkSubscription';

/**
 * POST /api/verify-subscription
 *
 * Verifies if a worker has subscribed to a client's YouTube channel
 *
 * Request body:
 * {
 *   "taskId": "uuid",
 *   "channelId": "UC..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { taskId, channelId } = body;

    if (!taskId || !channelId) {
      return NextResponse.json(
        { error: 'Missing taskId or channelId' },
        { status: 400 }
      );
    }

    // Get user's profile with Google token
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('google_token, role, youtube_access_granted')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!userProfile.google_token) {
      return NextResponse.json(
        {
          error: 'YouTube access not granted',
          errorCode: 'YOUTUBE_ACCESS_REQUIRED',
          message: 'Please grant YouTube access to verify subscription tasks',
          needsAccess: true
        },
        { status: 403 }
      );
    }

    // Check if user is subscribed to the channel
    const isSubscribed = await checkIfSubscribed(
      userProfile.google_token,
      channelId
    );

    if (!isSubscribed) {
      return NextResponse.json(
        {
          subscribed: false,
          message: 'Not subscribed to the channel'
        },
        { status: 200 }
      );
    }

    // If subscribed, update the task status in database
    // (You'll need to implement your task verification logic here)
    // For example:
    // await supabase
    //   .from('tasks')
    //   .update({
    //     status: 'verified',
    //     verified_at: new Date().toISOString()
    //   })
    //   .eq('id', taskId)
    //   .eq('worker_id', user.id);

    return NextResponse.json({
      subscribed: true,
      message: 'Subscription verified successfully',
      taskId,
      channelId,
    });

  } catch (error: any) {
    console.error('Error verifying subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify subscription',
        details: error.message
      },
      { status: 500 }
    );
  }
}
