'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, Plus, ArrowLeft } from 'lucide-react';
import FullLogo from './FullLogo';

type NavbarType = 'landing' | 'dashboard' | 'auth';
type UserRole = 'client' | 'worker' | 'admin' | 'generic';

interface NavbarProps {
  type: NavbarType;
  role?: UserRole;
  user?: {
    full_name?: string;
    email?: string;
  };
  onLogout?: () => void;
  onNewOrder?: () => void;
  onWithdraw?: () => void;
  balance?: number;
  backHref?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: string[];
}

export default function Navbar({
  type,
  role = 'generic',
  user,
  onLogout,
  onNewOrder,
  onWithdraw,
  balance,
  backHref = '/',
  activeTab,
  onTabChange,
  tabs = []
}: NavbarProps) {

  // Landing Page Navbar (Home, For-Clients, For-Workers)
  if (type === 'landing') {
    const getLoginHref = () => {
      if (role === 'client') return '/login/client';
      if (role === 'worker') return '/login/worker';
      return '/login';
    };

    const getSignupHref = () => {
      if (role === 'client') return '/signup/client';
      if (role === 'worker') return '/signup/worker';
      return '/signup';
    };

    const getButtonText = () => {
      if (role === 'client') return 'Get Started';
      if (role === 'worker') return 'Start Earning';
      return 'Get Started';
    };

    const showAuthButtons = role !== 'generic';

    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative border-b border-blue-500/20 backdrop-blur-xl bg-slate-950/50"
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <FullLogo />
            </Link>
            {showAuthButtons && (
              <div className="flex items-center gap-4">
                <Link
                  href={getLoginHref()}
                  className="text-gray-300 hover:text-white font-medium transition-colors"
                >
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href={getSignupHref()}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-500/30"
                  >
                    {getButtonText()}
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </nav>
      </motion.header>
    );
  }

  // Auth Pages Back Link
  if (type === 'auth') {
    return (
      <Link
        href={backHref}
        className="absolute top-4 left-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>Back</span>
      </Link>
    );
  }

  // Dashboard Header (Client, Worker, Admin)
  if (type === 'dashboard') {
    return (
      <header className="relative z-10 border-b border-blue-500/20 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <FullLogo />
            </Link>

            {/* Admin Tabs */}
            {role === 'admin' && tabs.length > 0 && (
              <div className="flex gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onTabChange?.(tab)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Client New Order Button */}
              {role === 'client' && onNewOrder && (
                <button
                  onClick={onNewOrder}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-pink-700 hover:to-cyan-700 transition-all flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>New Order</span>
                </button>
              )}

              {/* Worker Balance & Withdraw Button */}
              {role === 'worker' && (
                <>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Balance</p>
                    <p className="font-bold text-xl text-cyan-400">
                      ₦{balance?.toLocaleString() || '0'}
                    </p>
                  </div>
                  {onWithdraw && (
                    <button
                      onClick={onWithdraw}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      Withdraw
                    </button>
                  )}
                </>
              )}

              {/* User Info */}
              {user && (
                <div className="text-right">
                  <p className="text-sm text-gray-400">Welcome back,</p>
                  <p className="font-semibold">{user.full_name || user.email}</p>
                </div>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return null;
}
