import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const role = requestUrl.searchParams.get('role');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, request.url));
    }

    if (data.user) {
      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If user doesn't exist, create user record with role
      if (!existingUser) {
        const userRole = role === 'client' ? 'client' : 'worker';

        // Use service role client to bypass RLS for user creation
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

        const { error: insertError } = await supabaseAdmin.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          role: userRole,
          google_id: data.user.user_metadata.sub,
          full_name: data.user.user_metadata.full_name || data.user.user_metadata.name,
          avatar_url: data.user.user_metadata.avatar_url || data.user.user_metadata.picture,
          google_token: data.session?.provider_token,
        });

        if (insertError) {
          console.error('Error creating user:', insertError);

          // If duplicate key error (user already exists), fetch their existing role
          if (insertError.code === '23505') {
            console.log('User already exists, fetching their role...');

            const { data: existingUserData } = await supabaseAdmin
              .from('users')
              .select('role')
              .eq('id', data.user.id)
              .single();

            if (existingUserData) {
              const dashboardPath = existingUserData.role === 'admin' ? '/dashboard/admin'
                : existingUserData.role === 'worker' ? '/dashboard/worker'
                : '/dashboard/client';

              const redirectUrl = new URL(dashboardPath, request.url);
              const response = NextResponse.redirect(redirectUrl);

              // Ensure session cookies are set
              if (data.session) {
                response.cookies.set('sb-access-token', data.session.access_token, {
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7, // 7 days
                });
                response.cookies.set('sb-refresh-token', data.session.refresh_token, {
                  path: '/',
                  maxAge: 60 * 60 * 24 * 7, // 7 days
                });
              }

              return response;
            }
          }

          // For other errors, redirect to home
          return NextResponse.redirect(new URL('/?error=Failed to create user account', request.url));
        }

        // Create redirect response with session cookies
        const redirectUrl = new URL(userRole === 'worker' ? '/dashboard/worker' : '/dashboard/client', request.url);
        const response = NextResponse.redirect(redirectUrl);

        // Ensure session cookies are set
        if (data.session) {
          response.cookies.set('sb-access-token', data.session.access_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
          response.cookies.set('sb-refresh-token', data.session.refresh_token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });
        }

        return response;
      }

      // User exists, redirect to their dashboard based on role
      const dashboardPath = existingUser.role === 'admin' ? '/dashboard/admin'
        : existingUser.role === 'worker' ? '/dashboard/worker'
        : '/dashboard/client';

      const redirectUrl = new URL(dashboardPath, request.url);
      const response = NextResponse.redirect(redirectUrl);

      // Ensure session cookies are set
      if (data.session) {
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        response.cookies.set('sb-refresh-token', data.session.refresh_token, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }

      return response;
    }
  }

  // If error, redirect to home with error
  return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
}
