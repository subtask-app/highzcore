'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface GrantYouTubeAccessProps {
  onAccessGranted?: () => void;
  compact?: boolean;
}

export default function GrantYouTubeAccess({ onAccessGranted, compact = false }: GrantYouTubeAccessProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGrantAccess = async () => {
    try {
      setLoading(true);
      setError('');

      // Get OAuth URL from API
      const response = await fetch('/api/request-youtube-access');

      if (!response.ok) {
        throw new Error('Failed to generate OAuth URL');
      }

      const data = await response.json();

      // Redirect to Google OAuth
      window.location.href = data.oauthUrl;

    } catch (error: any) {
      setError(error.message || 'Failed to request YouTube access');
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Youtube className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              YouTube Access Required
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Grant YouTube access to verify subscription tasks automatically
            </p>
            <button
              onClick={handleGrantAccess}
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Redirecting...' : 'Grant Access'}
            </button>
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 max-w-md mx-auto"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-full p-4">
          <Youtube className="h-8 w-8 text-blue-400" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white text-center mb-3">
        Enable YouTube Verification
      </h2>

      {/* Description */}
      <p className="text-gray-400 text-center mb-6">
        To work on YouTube subscription tasks, you need to grant access to verify your subscriptions automatically.
      </p>

      {/* Benefits */}
      <div className="space-y-3 mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">Instant Verification</p>
            <p className="text-xs text-gray-400">Get paid immediately after completing tasks</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">Secure & Private</p>
            <p className="text-xs text-gray-400">We only check your subscriptions, nothing else</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Youtube className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">One-Time Setup</p>
            <p className="text-xs text-gray-400">Grant access once, works for all YouTube tasks</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Grant Access Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGrantAccess}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Redirecting to Google...</span>
          </div>
        ) : (
          'Grant YouTube Access'
        )}
      </motion.button>

      {/* Skip Option */}
      <p className="text-center text-sm text-gray-400 mt-4">
        You can skip this and grant access later when you need it
      </p>
    </motion.div>
  );
}
