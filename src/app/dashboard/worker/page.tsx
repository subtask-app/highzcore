'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@/lib/supabase/client';
import FullLogo from '@/components/FullLogo';

type Task = {
  id: string;
  contract_id: string;
  channel_name: string;
  channel_url: string;
  channel_image?: string;
  reward: number;
  status: 'available' | 'pending' | 'completed';
  claimed_at?: string;
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

export default function WorkerDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'available-tasks' | 'my-tasks' | 'withdrawals'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Data
  const [balance, setBalance] = useState(0);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

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

  const REWARD_PER_TASK = 120;
  const MIN_WITHDRAWAL = 1000;

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

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

      // Get user profile with wallet balance
      const { data: profile } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      setBalance(profile?.wallet_balance || 0);

      // Get available tasks (from active contracts)
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const available: Task[] = (contracts || []).map(contract => ({
        id: contract.id,
        contract_id: contract.id,
        channel_name: contract.channel_name,
        channel_url: contract.channel_url,
        channel_image: contract.channel_image,
        reward: REWARD_PER_TASK,
        status: 'available' as const,
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
        .order('completed_at', { ascending: false });

      const claimed: Task[] = (completions || []).map((completion: any) => ({
        id: completion.id,
        contract_id: completion.contract_id,
        channel_name: completion.contract?.channel_name || 'Unknown',
        channel_url: completion.contract?.channel_url || '#',
        channel_image: completion.contract?.channel_image,
        reward: completion.payout_amount || REWARD_PER_TASK,
        status: completion.verified ? 'completed' : 'pending' as const,
        claimed_at: completion.completed_at,
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

  const handleClaimTask = async (task: Task) => {
    try {
      setProcessingTaskId(task.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Record task completion (worker claims the task)
      const { error } = await supabase.from('completions').insert({
        contract_id: task.contract_id,
        worker_id: user.id,
        verified: false, // Admin will verify
        payout_amount: REWARD_PER_TASK,
      });

      if (error) throw error;

      showNotification('success', 'Task claimed! Pending admin verification.');
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error claiming task:', error);
      showNotification('error', error.message || 'Failed to claim task');
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleWithdrawRequest = async () => {
    try {
      const amount = parseFloat(withdrawForm.amount);

      if (!amount || amount < MIN_WITHDRAWAL) {
        showNotification('error', `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
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
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', bank_name: '', account_number: '', account_name: '' });
      fetchDashboardData();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      showNotification('error', error.message || 'Failed to request withdrawal');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400 bg-green-500/10';
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
        <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
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
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Available Tasks</span>
              {availableTasks.length > 0 && (
                <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {availableTasks.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                activeTab === 'my-tasks'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">My Tasks</span>
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  : 'hover:bg-slate-800'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Withdrawals</span>
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
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
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
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">Available Tasks</span>
                    {availableTasks.length > 0 && (
                      <span className="ml-auto bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {availableTasks.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('my-tasks'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer mb-2 ${
                      activeTab === 'my-tasks'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">My Tasks</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('withdrawals'); setShowMobileSidebar(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'withdrawals'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'hover:bg-slate-800'
                    }`}
                  >
                    <Wallet className="h-5 w-5" />
                    <span className="font-semibold">Withdrawals</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-auto">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Dashboard</h1>

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
                          <p className="text-sm text-gray-400">Min: ₦{MIN_WITHDRAWAL.toLocaleString()}</p>
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
                        className="mt-3 text-green-400 hover:text-green-300 cursor-pointer"
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
                      className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 hover:border-green-500/40 transition-all"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {task.channel_image ? (
                          <img src={task.channel_image} alt="" className="w-16 h-16 rounded-full" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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

                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Reward</span>
                          <span className="text-2xl font-bold text-green-400">₦{task.reward}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleClaimTask(task)}
                        disabled={processingTaskId === task.id}
                        className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processingTaskId === task.id ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            Claim Task
                          </>
                        )}
                      </button>

                      <p className="text-xs text-gray-500 text-center mt-3">
                        Subscribe to the channel to complete this task
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
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all cursor-pointer"
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
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
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

          {/* Withdrawals View */}
          {activeTab === 'withdrawals' && (
            <div>
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Withdrawals</h1>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={balance < MIN_WITHDRAWAL}
                  className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  <Wallet className="h-5 w-5" />
                  Request Withdrawal
                </button>
              </div>

              {/* Balance Card */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
                <p className="text-white/80 mb-2">Available Balance</p>
                <p className="text-4xl md:text-5xl font-bold text-white mb-4">₦{balance.toLocaleString()}</p>
                <p className="text-white/60 text-sm">
                  Minimum withdrawal: ₦{MIN_WITHDRAWAL.toLocaleString()}
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
                      className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                    />
                    <span className="absolute right-4 top-3 text-gray-400">₦</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ₦{balance.toLocaleString()} • Min: ₦{MIN_WITHDRAWAL.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={withdrawForm.bank_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                    placeholder="Enter bank name"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Account Number</label>
                  <input
                    type="text"
                    value={withdrawForm.account_number}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Account Name</label>
                  <input
                    type="text"
                    value={withdrawForm.account_name}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })}
                    placeholder="Enter account name"
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
