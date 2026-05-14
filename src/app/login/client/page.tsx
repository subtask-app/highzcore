'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TelegramBack from '@/components/telegram/TelegramBack';
import TelegramSignInButton from '@/components/telegram/TelegramSignInButton';
import { useIsTelegram } from '@/lib/telegram/webapp';

const FullLogo = dynamic(() => import('@/components/FullLogo'), { ssr: false });

export default function ClientLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();
  const inTelegram = useIsTelegram();

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Role hint is used only if this is a first-time login (no users row yet).
          // Existing users keep whatever role they already have.
          redirectTo: `${window.location.origin}/auth/callback?role=client`,
          scopes: 'email profile',
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Telegram's native top-left back-arrow (no-op outside Telegram). */}
      <TelegramBack href="/" />

      {/* Web-only in-page back link */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 z-20"
      >
        <Link
          href="/for-clients"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <FullLogo />
            <div className="mt-6 flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Creator Sign In</span>
            </div>
            <p className="text-gray-400 text-center mt-4">
              Sign in to access your creator dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Inside Telegram: one-tap Telegram sign-in (Google's OAuth screen
              is blocked inside Telegram's mobile webview). On web: Google. */}
          {inTelegram ? (
            <TelegramSignInButton role="client" />
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-gray-900 px-6 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </motion.button>
          )}

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-gray-400">{inTelegram ? 'Fast & secure' : 'Why Google?'}</span>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3 text-sm text-gray-400 mb-6">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <p>One-click sign in — no password to remember</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <p>{inTelegram ? 'Telegram confirms who you are — nothing else shared' : 'We only read your name, email, and profile photo'}</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <p>Your account stays separate from your channels — nothing is posted</p>
            </div>
          </div>

          {/* Don't have account */}
          <div className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup/client" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Sign up as Creator
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
