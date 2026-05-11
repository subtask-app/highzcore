import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * GET /auth/youtube-callback
 *
 * Handles the YouTube OAuth callback and stores the access token
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // User ID from the OAuth request
  const error = requestUrl.searchParams.get('error');

  if (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/worker?error=youtube_auth_failed`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/dashboard/worker?error=missing_code`, request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${requestUrl.origin}/auth/youtube-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL(`/dashboard/worker?error=token_exchange_failed`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token } = tokens;

    // Use service role client to update user's Google token (bypass RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update user's google_token in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        google_token: access_token,
        google_refresh_token: refresh_token || null,
        youtube_access_granted: true,
        youtube_access_granted_at: new Date().toISOString(),
      })
      .eq('id', state); // state contains the user ID

    if (updateError) {
      console.error('Error updating user YouTube token:', updateError);
      return NextResponse.redirect(
        new URL(`/dashboard/worker?error=failed_to_save_token`, request.url)
      );
    }

    // Success! Redirect back to worker dashboard
    return NextResponse.redirect(
      new URL(`/dashboard/worker?youtube_granted=true`, request.url)
    );

  } catch (error: any) {
    console.error('YouTube callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/worker?error=youtube_callback_failed`, request.url)
    );
  }
}
