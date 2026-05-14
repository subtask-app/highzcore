'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Play,
  DollarSign,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Menu,
  X,
  ArrowRight,
  Calendar,
  Award,
  Ban
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FullLogo from '@/components/FullLogo';
import GrantYouTubeAccess from '@/components/youtube/GrantYouTubeAccess';
import { useYouTubeAccess } from '@/hooks/useYouTubeAccess';
import { WORKER_PAYOUT_PER_TASK, MIN_WITHDRAWAL_AMOUNT, REFERRAL_BONUS } from '@/lib/constants';
import TaskFlowModal, { type TaskFlowTask } from '@/components/worker/TaskFlowModal';
import {
  useTelegramBackButton,
  useTelegramMainButton,
  hapticTap,
  hapticBump,
  hapticSelect,
} from '@/lib/telegram/webapp';

type Task = {
  id: string;
  contract_id: string;
  channel_name: string;
  channel_url: string;
  channel_image?: string;
  reward: number;
  status: 'available' | 'pending' | 'completed';
  claimed_at?: string;
  target_subscribers?: number;
  verified_count?: number;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  bank_name: string;
  account_number: string;
  account_name: string;
  requested_at: string;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

// Next 16 requires anything that reads useSearchParams() (or that touches
// `nuqs`, the searchParams pattern, etc.) to live inside a <Suspense>
// boundary so the prerender can bail cleanly during static analysis.
// The actual dashboard is `WorkerDashboardInner`; the default export wraps it.
export default function WorkerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white" />}>
      <WorkerDashboardInner />
    </Suspense>
  );
}

function WorkerDashboardInner() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'available-tasks' | 'my-tasks' | 'withdrawals' | 'leaderboard'>('dashboard');
  // M12 — engagement
  const [streak, setStreak] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Array<{ rank: number; user_id: string; display_name: string; telegram_username: string | null; avatar_url: string | null; total_earned: number; task_count: number }>>([]);
  const [leaderboardWindow, setLeaderboardWindow] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [copied, setCopied] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Data
  const [balance, setBalance] = useState(0);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Task flow modal (M6)
  const [activeTaskFlow, setActiveTaskFlow] = useState<TaskFlowTask | null>(null);
  const [taskFlowInitialPhase, setTaskFlowInitialPhase] = useState<'brief' | 'subscribe' | undefined>(undefined);

  // M11 — Telegram MainButton/BackButton wiring for the withdrawal modal.
  // These hooks no-op outside Telegram, so web users keep the in-app buttons.

  // Withdrawal form
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const { hasAccess: hasYouTubeAccess, loading: ytLoading, refresh: refreshYouTube } = useYouTubeAccess();

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  // Surface YouTube grant flow result coming back via query params, and
  // auto-resume the TaskFlowModal if the user was mid-task when they were
  // redirected to Google.
  useEffect(() => {
    const granted = searchParams.get('youtube_granted');
    const ytError = searchParams.get('youtube_error');
    if (granted) {
      showNotification('success', 'YouTube access granted. Pick up where you left off.');
      void refreshYouTube();

      let pendingContractId: string | null = null;
      try { pendingContractId = window.localStorage.getItem('hzcr_pending_claim'); } catch {}
      if (pendingContractId) {
        try { window.localStorage.removeItem('hzcr_pending_claim'); } catch {}
        // Defer until availableTasks is populated, then re-open the modal
        // at the "subscribe" phase for the right task.
        const interval = setInterval(() => {
          setAvailableTasks((tasks) => {
            const t = tasks.find((x) => x.contract_id === pendingContractId);
            if (t) {
              setActiveTaskFlow({
                contract_id: t.contract_id,
                channel_name: t.channel_name,
                channel_url: t.channel_url,
                channel_image: t.channel_image,
                payout: t.reward,
                target_subscribers: t.target_subscribers ?? 0,
                verified_count: t.verified_count ?? 0,
              });
              setTaskFlowInitialPhase('subscribe');
              clearInterval(interval);
            }
            return tasks;
          });
        }, 250);
        // Safety: give up after 5s if the task didn't load.
        setTimeout(() => clearInterval(interval), 5000);
      }

      router.replace('/dashboard/worker');
    } else if (ytError) {
      showNotification('error', `Couldn't grant YouTube access: ${ytError.replaceAll('_', ' ')}`);
      router.replace('/dashboard/worker');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();

    // Real-time subscriptions
    const contractsChannel = supabase
      .channel('worker-contracts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const completionsChannel = supabase
      .channel('worker-completions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('worker-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(completionsChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login/worker');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'worker') {
      router.push('/');
      return;
    }

    setUser(profile);
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with wallet balance + engagement state
      const { data: profile } = await supabase
        .from('users')
        .select('wallet_balance, streak_count')
        .eq('id', user.id)
        .single() as { data: { wallet_balance: number | null; streak_count: number | null } | null };

      setBalance(profile?.wallet_balance || 0);
      setStreak(profile?.streak_count || 0);

      // Count of users referred by me — drives the referral card stat.
      const { count: refCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by_user_id', user.id);
      setReferralCount(refCount || 0);

      // Get available tasks (from active contracts)
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const available: Task[] = (contracts || []).map((contract: any) => ({
        id: contract.id,
        contract_id: contract.id,
        channel_name: contract.channel_name,
        channel_url: contract.channel_url,
        channel_image: contract.channel_image,
        reward: contract.worker_payout_per_task ?? WORKER_PAYOUT_PER_TASK,
        status: 'available' as const,
        target_subscribers: contract.target_subscribers,
        verified_count: contract.verified_count,
      }));

      setAvailableTasks(available);

      // Get my completed tasks (from completions table)
      const { data: completions } = await supabase
        .from('completions')
        .select(`
          *,
          contract:contracts(
            id,
            channel_name,
            channel_url,
            channel_image
          )
        `)
        .eq('worker_id', user.id)
        .order('claimed_at', { ascending: false });

      const claimed: Task[] = (completions || []).map((completion: any) => ({
        id: completion.id,
        contract_id: completion.contract_id,
        channel_name: completion.contract?.channel_name || 'Unknown',
        channel_url: completion.contract?.channel_url || '#',
        channel_image: completion.contract?.channel_image,
        reward: completion.payout_amount || WORKER_PAYOUT_PER_TASK,
        status: completion.verified ? 'completed' : 'pending' as const,
        claimed_at: completion.claimed_at,
      }));

      setMyTasks(claimed);

      // Get withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('worker_id', user.id)
        .order('requested_at', { ascending: false });

      setWithdrawals(withdrawalsData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showNotification('error', 'Failed to fetch dashboard data');
    }
  };

  // M6: opens the multi-phase TaskFlowModal. Claim/verify/credit happens
  // inside that modal — no direct DB insert from here anymore.
  const openTaskFlow = (task: Task) => {
    setActiveTaskFlow({
      contract_id: task.contract_id,
      channel_name: task.channel_name,
      channel_url: task.channel_url,
      channel_image: task.channel_image,
      payout: task.reward,
      target_subscribers: task.target_subscribers ?? 0,
      verified_count: task.verified_count ?? 0,
    });
    setTaskFlowInitialPhase(undefined);
  };

  const closeTaskFlow = () => {
    setActiveTaskFlow(null);
    setTaskFlowInitialPhase(undefined);
  };

  const handleWithdrawRequest = async () => {
    try {
      const amount = parseFloat(withdrawForm.amount);

      if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
        showNotification('error', `Minimum withdrawal is ₦${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}`);
        return;
      }

      if (amount > balance) {
        showNotification('error', 'Insufficient balance');
        return;
      }

      if (!withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_name) {
        showNotification('error', 'Please fill in all bank details');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('withdrawals').insert({
        worker_id: user.id,
        amount: amount,
        bank_name: withdrawForm.bank_name,
        account_number: withdrawForm.account_number,
        account_name: withdrawForm.account_name,
        status: 'pending',
      });

      if (error) throw error;

      showNotification('success', 'Withdrawal request submitted successfully!');
      hapticBump();
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', bank_name: '', account_number: '', account_name: '' });
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      showNotification('error', error.message || 'Failed to request withdrawal');
    }
  };

  // M12 — Leaderboard fetcher. Refetches on tab open / window change.
  const fetchLeaderboard = async (win: 'today' | 'week' | 'month' | 'all' = leaderboardWindow) => {
    try {
      const res = await fetch(`/api/leaderboard?window=${win}&limit=20`);
      if (!res.ok) return;
      const json = await res.json();
      setLeaderboard(json.entries ?? []);
    } catch (e) {
      console.error('leaderboard fetch failed', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard(leaderboardWindow);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, leaderboardWindow]);

  // M12 — Referral share helper. Inside Telegram we open the native share
  // sheet; otherwise we copy the link to clipboard.
  const buildReferralLink = (userId: string): string => {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'HighzcoreOfficial_bot';
    return `https://t.me/${botUsername}?start=ref_${userId}`;
  };

  const handleShareReferral = async () => {
    if (!user?.id) return;
    const link = buildReferralLink(user.id);
    const text = `Join me on Highzcore — earn ₦${WORKER_PAYOUT_PER_TASK} per YouTube task. Free signup.`;

    // Inside Telegram: open the native share sheet via t.me/share/url.
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
    if (tg) {
      const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
      try {
        // openTelegramLink keeps the user inside Telegram.
        (tg as any).openTelegramLink?.(shareUrl) ?? window.open(shareUrl, '_blank');
        hapticBump();
        return;
      } catch {}
    }
    // Web fallback: copy to clipboard.
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      showNotification('success', 'Link copied — share it anywhere');
    } catch {
      showNotification('error', 'Could not copy. Long-press to copy: ' + link);
    }
  };

  // M11 — Telegram native UX for the withdraw modal.
  useTelegramBackButton(() => { hapticTap(); setShowWithdrawModal(false); }, showWithdrawModal);
  useTelegramMainButton({
    text: 'Submit withdrawal',
    onClick: () => { hapticBump(); handleWithdrawRequest(); },
    show: showWithdrawModal,
    disabled: parseFloat(withdrawForm.amount || '0') < MIN_WITHDRAWAL_AMOUNT,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-cyan-300 bg-cyan-500/10';
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'completed': return 'text-blue-400 bg-blue-500/10';
      case 'paid': return 'text-green-400 bg-green-500/10';
      case 'rejected': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const stats = {
    walletBalance: balance,
    completedTasks: myTasks.filter(t => t.status === 'completed').length,
    pendingTasks: myTasks.filter(t => t.status === 'pending').length,
    totalEarnings: myTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Navbar */}
      <nav className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center">
              <FullLogo className="h-10 w-auto" />
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Award className="h-4 w-4" />
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold">{user?.full_name || 'Worker'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-blue-500/20 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-700">
                      <p className="font-semibold">{user?.full_name}</p>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                      <div className="mt-3 flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                        <Wallet className="h-4 w-4 text-green-400" />
                        <span className="text-sm">
                          <span className="text-gray-400">Balance: </span>
                          <span className="font-bold text-green-400">₦{balance.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full p-4 flex items-center gap-3 hover:bg-slate-800 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="h-5 w-5 text-red-400" />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 min-h-screen bg-slate-900/80 backdrop-blur-xl border-r border-blue-500/20">
          <div className="p-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-semibold">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('available-tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                activeTab === 'available-tasks'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Available Tasks</span>
              {availableTasks.length > 0 && (
                <span className="ml-auto bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {availableTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                activeTab === 'my-tasks'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">My Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                activeTab === 'withdrawals'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Withdrawals</span>
            </button>

            {/* M12 — Leaderboard */}
            <button
              onClick={() => { setActiveTab('leaderboard'); hapticSelect(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">Leaderboard</span>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {showMobileSidebar && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileSidebar(false)}
                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 z-50 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <FullLogo className="h-8 w-auto" />
                    <button
                      onClick={() => setShowMobileSidebar(false)}
                      className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => { setActiveTab('dashboard'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                      activeTab === 'dashboard'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-semibold">Dashboard</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('available-tasks'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                      activeTab === 'available-tasks'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">Available Tasks</span>
                    {availableTasks.length > 0 && (
                      <span className="ml-auto bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {availableTasks.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('my-tasks'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                      activeTab === 'my-tasks'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">My Tasks</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('withdrawals'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                      activeTab === 'withdrawals'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="font-semibold">Withdrawals</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('leaderboard'); setShowMobileSidebar(false); hapticSelect(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'leaderboard'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="font-semibold">Leaderboard</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {/* YouTube grant banner — shown until the worker connects their YouTube account */}
          {!ytLoading && !hasYouTubeAccess && (
            <div className="mb-6">
              <GrantYouTubeAccess compact onAccessGranted={refreshYouTube} />
            </div>
          )}

          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>

                {/* M12 — Streak badge. Hidden until the worker actually starts a streak. */}
                {streak > 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-bold">
                    <span className="text-base leading-none">🔥</span>
                    <span>{streak}-day streak</span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <Wallet className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Wallet Balance</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-400">₦{stats.walletBalance.toLocaleString()}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Completed Tasks</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.completedTasks}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-500/10 rounded-xl">
                      <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Pending Tasks</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.pendingTasks}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Total Earnings</p>
                  <p className="text-2xl md:text-3xl font-bold">₦{stats.totalEarnings.toLocaleString()}</p>
                </motion.div>
              </div>

              {/* M12 — Referral card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-slate-900/60 border border-amber-400/30 rounded-2xl p-5 md:p-6 mb-6"
              >
                <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
                <div className="relative flex items-start gap-4 flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_10px_28px_-8px_rgba(251,146,60,0.55)] text-2xl">
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-200 text-[10px] font-bold uppercase tracking-[0.25em] mb-1">Bring a friend</p>
                    <h3 className="text-white font-bold text-base md:text-lg leading-tight">
                      Earn ₦{REFERRAL_BONUS} per friend who joins and verifies their first task.
                    </h3>
                    <p className="text-white/65 text-xs md:text-sm leading-relaxed mt-1">
                      {referralCount > 0
                        ? <>You've brought <strong className="text-white">{referralCount}</strong> friend{referralCount === 1 ? '' : 's'} so far. Keep going.</>
                        : <>One link, instant credit. No cap.</>}
                    </p>
                  </div>
                  <button
                    onClick={handleShareReferral}
                    className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 px-5 py-2.5 text-slate-950 font-black text-sm shadow-[0_10px_24px_-8px_rgba(251,146,60,0.6)] transition cursor-pointer whitespace-nowrap"
                  >
                    {copied ? 'Copied ✓' : 'Share my link'}
                    {!copied && <ArrowRight className="h-4 w-4" strokeWidth={3} />}
                  </button>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('available-tasks')}
                      className="w-full p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-green-400" />
                        <div className="text-left">
                          <p className="font-semibold">View Available Tasks</p>
                          <p className="text-sm text-gray-400">{availableTasks.length} tasks available</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-400" />
                    </button>

                    <button
                      onClick={() => { setShowWithdrawModal(true); }}
                      className="w-full p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-blue-400" />
                        <div className="text-left">
                          <p className="font-semibold">Request Withdrawal</p>
                          <p className="text-sm text-gray-400">Min: ₦{MIN_WITHDRAWAL_AMOUNT.toLocaleString()}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-400" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  {myTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No activity yet</p>
                      <button
                        onClick={() => setActiveTab('available-tasks')}
                        className="mt-3 text-cyan-300 hover:text-cyan-200 cursor-pointer"
                      >
                        Start earning →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className="p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm truncate">{task.channel_name}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">+₦{task.reward}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Available Tasks View */}
          {activeTab === 'available-tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Available Tasks</h1>
                <button
                  onClick={fetchDashboardData}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              {availableTasks.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">No tasks available right now</p>
                  <p className="text-gray-500 text-sm">Check back later for new opportunities</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {availableTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:border-cyan-400/40 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {task.channel_image ? (
                          <img src={task.channel_image} alt="" className="w-16 h-16 rounded-full" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                            <Play className="h-8 w-8" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate">{task.channel_name}</h3>
                          <a
                            href={task.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                          >
                            Visit Channel
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>

                      {/* Reward + slots-remaining */}
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Reward</span>
                          <span className="text-2xl font-bold text-green-400">₦{task.reward}</span>
                        </div>
                      </div>

                      {/* Live target progress — drops as more workers verify. */}
                      {typeof task.target_subscribers === 'number' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-gray-400">Slots remaining</span>
                            <span className="text-white font-semibold tabular-nums">
                              {Math.max((task.target_subscribers ?? 0) - (task.verified_count ?? 0), 0)} / {task.target_subscribers}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, ((task.verified_count ?? 0) / (task.target_subscribers || 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => openTaskFlow(task)}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Start task
                      </button>

                      <p className="text-xs text-gray-500 text-center mt-3">
                        Read instructions, subscribe, get paid.
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Tasks View */}
          {activeTab === 'my-tasks' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">My Tasks</h1>

              {myTasks.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg mb-2">You haven't claimed any tasks yet</p>
                  <button
                    onClick={() => setActiveTab('available-tasks')}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                  >
                    Browse Available Tasks
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Channel</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Reward</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Claimed</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTasks.map((task) => (
                          <tr key={task.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {task.channel_image ? (
                                  <img src={task.channel_image} alt="" className="w-10 h-10 rounded-full" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                    <Play className="h-5 w-5" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold">{task.channel_name}</p>
                                  <a
                                    href={task.channel_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    View
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-green-400">₦{task.reward.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                {getStatusText(task.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-400">
                                {task.claimed_at ? new Date(task.claimed_at).toLocaleDateString() : 'N/A'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <a
                                href={task.channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                              >
                                View Channel
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {myTasks.map((task) => (
                      <div key={task.id} className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex items-start gap-3 mb-4">
                          {task.channel_image ? (
                            <img src={task.channel_image} alt="" className="w-12 h-12 rounded-full" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                              <Play className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{task.channel_name}</h3>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                              {getStatusText(task.status)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Reward:</span>
                            <span className="font-bold text-green-400">₦{task.reward.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Claimed:</span>
                            <span className="text-sm">{task.claimed_at ? new Date(task.claimed_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>

                        <a
                          href={task.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 font-semibold text-center flex items-center justify-center gap-2 cursor-pointer"
                        >
                          View Channel
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* M12 — Leaderboard View */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Leaderboard</h1>
                <div className="inline-flex rounded-xl bg-slate-900/80 border border-amber-500/20 p-1">
                  {(['today', 'week', 'month', 'all'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => { hapticSelect(); setLeaderboardWindow(w); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest transition ${
                        leaderboardWindow === w
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      {w === 'all' ? 'All-time' : w}
                    </button>
                  ))}
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <TrendingUp className="h-12 w-12 md:h-16 md:w-16 text-amber-400/40 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No verified earnings in this window yet.</p>
                  <p className="text-gray-500 text-sm mt-2">Verify tasks today to land on the board.</p>
                </div>
              ) : (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl overflow-hidden">
                  {leaderboard.map((row, i) => {
                    const isMe = row.user_id === user?.id;
                    const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null;
                    return (
                      <div
                        key={row.user_id}
                        className={`flex items-center gap-4 p-4 md:p-5 ${i !== leaderboard.length - 1 ? 'border-b border-white/5' : ''} ${
                          isMe ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent' : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 text-center">
                          {medal ? (
                            <span className="text-2xl">{medal}</span>
                          ) : (
                            <span className="text-white/40 font-black text-lg">{row.rank}</span>
                          )}
                        </div>
                        {row.avatar_url ? (
                          <img src={row.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 grid place-items-center text-white font-bold text-sm">
                            {row.display_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isMe ? 'text-amber-200' : 'text-white'}`}>
                            {row.display_name}{isMe && <span className="text-amber-300/70 font-normal text-xs ml-2">(you)</span>}
                          </p>
                          <p className="text-xs text-white/50">
                            {row.task_count} task{row.task_count === 1 ? '' : 's'} verified
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-amber-300 tabular-nums">
                            ₦{Number(row.total_earned).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-center text-xs text-white/40 mt-4">
                Only first names shown. Earnings are based on verified completions in the selected window.
              </p>
            </div>
          )}

          {/* Withdrawals View */}
          {activeTab === 'withdrawals' && (
            <div>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Withdrawals</h1>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={balance < MIN_WITHDRAWAL_AMOUNT}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="h-5 w-5" />
                  Request Withdrawal
                </button>
              </div>

              {/* Balance Card */}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
                <p className="text-white/80 mb-2">Available Balance</p>
                <p className="text-4xl md:text-5xl font-bold text-white mb-4">₦{balance.toLocaleString()}</p>
                <p className="text-white/60 text-sm">
                  Minimum withdrawal: ₦{MIN_WITHDRAWAL_AMOUNT.toLocaleString()}
                </p>
              </div>

              {/* Withdrawal History */}
              <h2 className="text-xl font-bold mb-4">Withdrawal History</h2>
              {withdrawals.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <Wallet className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No withdrawal history yet</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-800/50 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Bank Details</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((withdrawal) => (
                          <tr key={withdrawal.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-green-400">₦{withdrawal.amount.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold">{withdrawal.account_name}</p>
                              <p className="text-sm text-gray-400">{withdrawal.bank_name}</p>
                              <p className="text-xs text-gray-500">{withdrawal.account_number}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                                {getStatusText(withdrawal.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm">{new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-2xl font-bold text-green-400">₦{withdrawal.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-400">{new Date(withdrawal.requested_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                            {getStatusText(withdrawal.status)}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-lg">
                          <p className="font-semibold">{withdrawal.account_name}</p>
                          <p className="text-sm text-gray-400">{withdrawal.bank_name}</p>
                          <p className="text-xs text-gray-500">{withdrawal.account_number}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWithdrawModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-6">Request Withdrawal</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-3 text-gray-400">₦</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ₦{balance.toLocaleString()} • Min: ₦{MIN_WITHDRAWAL_AMOUNT.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={withdrawForm.bank_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                    placeholder="Enter bank name"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Account Number</label>
                  <input
                    type="text"
                    value={withdrawForm.account_number}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Account Name</label>
                  <input
                    type="text"
                    value={withdrawForm.account_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })}
                    placeholder="Enter account name"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawRequest}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* M6 — Task lifecycle modal */}
      <TaskFlowModal
        open={Boolean(activeTaskFlow)}
        task={activeTaskFlow}
        hasYouTubeAccess={hasYouTubeAccess}
        initialPhase={taskFlowInitialPhase}
        onClose={closeTaskFlow}
        onVerified={(r) => {
          // Refresh balance + tasks after a verified completion.
          fetchDashboardData();
          if (typeof r.new_balance === 'number') setBalance(r.new_balance);
        }}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur-xl border ${
                notif.type === 'success'
                  ? 'bg-green-500/20 border-green-500/50 text-green-400'
                  : notif.type === 'error'
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              }`}
            >
              <div className="flex items-center gap-3">
                {notif.type === 'success' && <CheckCircle2 className="h-5 w-5" />}
                {notif.type === 'error' && <AlertCircle className="h-5 w-5" />}
                {notif.type === 'info' && <AlertCircle className="h-5 w-5" />}
                <p className="font-semibold">{notif.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
