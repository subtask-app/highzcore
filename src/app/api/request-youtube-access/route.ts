import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/request-youtube-access
 *
 * Returns the OAuth URL for requesting YouTube access
 */
export async function GET(request: NextRequest) {
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

    // Generate OAuth URL with YouTube scope
    const origin = request.nextUrl.origin;
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(`${origin}/auth/youtube-callback`)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly')}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${user.id}`; // Pass user ID to identify them after OAuth

    return NextResponse.json({
      oauthUrl,
      message: 'Redirect user to this URL to grant YouTube access'
    });

  } catch (error: any) {
    console.error('Error generating YouTube OAuth URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate OAuth URL',
        details: error.message
      },
      { status: 500 }
    );
  }
}
