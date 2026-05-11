'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users as UsersIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  MessageSquare,
  DollarSign,
  Eye,
  AlertCircle,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  FileText,
  Plus,
  Send,
  ExternalLink,
  Menu,
  X,
  ArrowLeft,
  Wallet,
  Check,
  Pause,
  Ban,
  User,
  Image as ImageIcon,
  Video,
  Paperclip
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import FullLogo from '@/components/FullLogo';

type Contract = {
  id: string;
  client_id: string;
  client_email?: string;
  channel_name: string;
  channel_url: string;
  channel_image?: string;
  target_subscribers: number;
  current_subscribers: number;
  price_per_subscriber: number;
  total_amount: number;
  status: 'pending_payment' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_tasks: number;
  pending_tasks: number;
};

type Withdrawal = {
  id: string;
  worker_id: string;
  worker_email?: string;
  worker_name?: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  created_at: string;
  requested_at?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'client' | 'worker' | 'admin';
  wallet_balance: number;
  created_at: string;
  avatar_url?: string;
};

type Message = {
  id: string;
  contract_id: string;
  sender_id: string;
  message: string;
  is_from_client: boolean;
  created_at: string;
  media_url?: string;
  media_type?: 'image' | 'video';
};

type Completion = {
  id: string;
  contract_id: string;
  worker_id: string;
  worker_email?: string;
  worker_name?: string;
  channel_name?: string;
  channel_url?: string;
  verified: boolean;
  payout_amount: number;
  completed_at: string;
  screenshot_url?: string;
  notes?: string;
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'contracts' | 'task-verifications' | 'withdrawals' | 'users' | 'messages'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileChatList, setShowMobileChatList] = useState(true);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Data
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContractForChat, setSelectedContractForChat] = useState<Contract | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showWorkerProfileModal, setShowWorkerProfileModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<UserProfile | null>(null);

  const router = useRouter();
  const supabase = createClient();

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
      .channel('admin-contracts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('admin-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (selectedContractForChat && payload.new?.contract_id === selectedContractForChat.id) {
          fetchMessages(selectedContractForChat.id);
        }
        fetchDashboardData();
      })
      .subscribe();

    const withdrawalsChannel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, [selectedContractForChat]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login/worker');
      return;
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      setShowAccessDeniedModal(true);
      setLoading(false);
      return;
    }

    setUser(profile);
    setLoading(false);
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch all users first (for mapping emails)
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, email, full_name');

      const usersMap = new Map(allUsers?.map(u => [u.id, u]) || []);

      // Fetch contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('❌ Error fetching contracts:', contractsError);
        showNotification('error', 'Failed to fetch contracts. Check browser console for details.');
      } else {
        console.log('✅ Contracts fetched:', contractsData);
      }

      // Map client emails to contracts
      setContracts(contractsData?.map(c => ({
        ...c,
        client_email: usersMap.get(c.client_id)?.email
      })) || []);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('requested_at', { ascending: false });

      if (withdrawalsError) {
        console.error('❌ Error fetching withdrawals:', withdrawalsError);
      } else {
        console.log('✅ Withdrawals fetched:', withdrawalsData);
      }

      // Map worker info to withdrawals
      setWithdrawals(withdrawalsData?.map(w => ({
        ...w,
        worker_email: usersMap.get(w.worker_id)?.email,
        worker_name: usersMap.get(w.worker_id)?.full_name,
        created_at: w.requested_at // Map requested_at to created_at for display consistency
      })) || []);

      // Fetch completions (task claims by workers)
      const { data: completionsData, error: completionsError } = await supabase
        .from('completions')
        .select(`
          *,
          contract:contracts(
            channel_name,
            channel_url,
            channel_image
          )
        `)
        .order('completed_at', { ascending: false });

      if (completionsError) {
        console.error('❌ Error fetching completions:', completionsError);
      } else {
        console.log('✅ Completions fetched:', completionsData);
      }

      // Map worker and contract info to completions
      setCompletions(completionsData?.map((c: any) => ({
        ...c,
        worker_email: usersMap.get(c.worker_id)?.email,
        worker_name: usersMap.get(c.worker_id)?.full_name,
        channel_name: c.contract?.channel_name,
        channel_url: c.contract?.channel_url,
        channel_image: c.contract?.channel_image,
      })) || []);

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
      } else {
        console.log('✅ Users fetched:', usersData);
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to fetch dashboard data');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (contractId: string) => {
    try {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Scroll to bottom after messages load
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      showNotification('error', 'Failed to fetch messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleContractAction = async (contractId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ status: newStatus })
        .eq('id', contractId);

      if (error) throw error;

      showNotification('success', `Contract ${newStatus} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating contract:', error);
      showNotification('error', 'Failed to update contract');
    }
  };

  const handleWithdrawalAction = async (withdrawalId: string, newStatus: 'paid' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ status: newStatus })
        .eq('id', withdrawalId);

      if (error) throw error;

      showNotification('success', `Withdrawal ${newStatus} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      showNotification('error', 'Failed to update withdrawal');
    }
  };

  const handleVerifyCompletion = async (completionId: string, approve: boolean) => {
    try {
      if (approve) {
        // Get completion details to find worker and payout amount
        const completion = completions.find(c => c.id === completionId);
        if (!completion) {
          showNotification('error', 'Completion not found');
          return;
        }

        // Update completion to verified
        const { error: completionError } = await supabase
          .from('completions')
          .update({
            verified: true,
            verified_at: new Date().toISOString(),
            verified_by: user.id
          })
          .eq('id', completionId);

        if (completionError) throw completionError;

        // Add payout to worker's wallet
        const { data: workerData, error: workerFetchError } = await supabase
          .from('users')
          .select('wallet_balance')
          .eq('id', completion.worker_id)
          .single();

        if (workerFetchError) throw workerFetchError;

        const newBalance = (workerData?.wallet_balance || 0) + completion.payout_amount;

        const { error: walletError } = await supabase
          .from('users')
          .update({ wallet_balance: newBalance })
          .eq('id', completion.worker_id);

        if (walletError) throw walletError;

        showNotification('success', `Task verified and ₦${completion.payout_amount.toLocaleString()} paid to worker!`);
      } else {
        // Reject - delete the completion
        const { error } = await supabase
          .from('completions')
          .delete()
          .eq('id', completionId);

        if (error) throw error;

        showNotification('success', 'Task completion rejected');
      }

      fetchDashboardData();
    } catch (error: any) {
      console.error('Error verifying completion:', error);
      showNotification('error', error.message || 'Failed to verify completion');
    }
  };

  const uploadToCloudinary = async (file: File): Promise<{ url: string; type: 'image' | 'video' }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'subtask_media'); // You'll need to create this preset in Cloudinary

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    return { url: data.secure_url, type: resourceType };
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedContractForChat) return;

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let mediaUrl = null;
      let mediaType = null;

      // Upload file to Cloudinary if there's a file selected
      if (selectedFile) {
        const uploadResult = await uploadToCloudinary(selectedFile);
        mediaUrl = uploadResult.url;
        mediaType = uploadResult.type;
      }

      const { error } = await supabase.from('messages').insert({
        contract_id: selectedContractForChat.id,
        sender_id: user.id,
        message: newMessage.trim() || (mediaType === 'image' ? 'Sent an image' : 'Sent a video'),
        is_from_client: false,
        media_url: mediaUrl,
        media_type: mediaType,
      });

      if (error) throw error;

      setNewMessage('');
      setSelectedFile(null);
      // Real-time will handle updating messages, no need to call fetchMessages
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('error', 'Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const openChatForContract = (contract: Contract) => {
    setSelectedContractForChat(contract);
    setActiveTab('messages');
    setShowMobileChatList(false);
    fetchMessages(contract.id);
  };

  const viewWorkerProfile = async (workerId: string) => {
    const worker = users.find(u => u.id === workerId);
    if (worker) {
      setSelectedWorker(worker);
      setShowWorkerProfileModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'completed': return 'text-blue-400 bg-blue-500/10';
      case 'pending_payment':
      case 'pending': return 'text-yellow-400 bg-yellow-500/10';
      case 'cancelled':
      case 'rejected': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'pending': return 'Pending';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-400 bg-purple-500/10';
      case 'client': return 'text-cyan-400 bg-cyan-500/10';
      case 'worker': return 'text-green-400 bg-green-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const calculateProgress = (contract: Contract) => {
    if (contract.target_subscribers === 0) return 0;
    return Math.min(100, (contract.current_subscribers / contract.target_subscribers) * 100);
  };

  const stats = {
    totalRevenue: contracts.reduce((sum, c) => sum + c.total_amount, 0) * 0.2, // 20% platform fee
    activeContracts: contracts.filter(c => c.status === 'active').length,
    pendingWithdrawals: withdrawals.filter(w => w.status === 'pending').length,
    totalUsers: users.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (showAccessDeniedModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 text-white">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#8b5cf620_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf620_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-gray-400 mb-6">
                You don't have admin privileges required to access this dashboard.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all cursor-pointer"
                >
                  Go to Home
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 text-white">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8b5cf620_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf620_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Navbar */}
      <nav className="relative z-20 bg-slate-900/80 backdrop-blur-xl border-b border-blue-500/20">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Menu Button + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="hidden sm:block">
                <FullLogo />
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              >
                {user?.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold">{user?.full_name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-slate-900 border border-blue-500/20 rounded-lg shadow-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-sm font-semibold">{user?.full_name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                      <p className="text-xs text-purple-400 mt-1">Admin Account</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors flex items-center gap-2 text-red-400 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative z-10">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 min-h-screen bg-slate-900/80 backdrop-blur-xl border-r border-blue-500/20 p-6">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-semibold">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'contracts'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Contracts</span>
            </button>

            <button
              onClick={() => setActiveTab('task-verifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'task-verifications'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Task Verifications</span>
              {completions.filter(c => !c.verified).length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {completions.filter(c => !c.verified).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'withdrawals'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wallet className="h-5 w-5" />
              <span className="font-semibold">Withdrawals</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UsersIcon className="h-5 w-5" />
              <span className="font-semibold">Users</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">Messages</span>
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
                className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-blue-500/20 p-6 z-50 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <FullLogo />
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {[
                    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { key: 'contracts', label: 'Contracts', icon: FileText },
                    { key: 'task-verifications', label: 'Task Verifications', icon: CheckCircle2 },
                    { key: 'withdrawals', label: 'Withdrawals', icon: Wallet },
                    { key: 'users', label: 'Users', icon: UsersIcon },
                    { key: 'messages', label: 'Messages', icon: MessageSquare },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key as any);
                        setShowMobileSidebar(false);
                        if (tab.key === 'messages') setShowMobileChatList(true);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                          : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="font-semibold">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Admin Dashboard</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Platform Revenue (20%)</p>
                  <p className="text-2xl md:text-3xl font-bold">₦{stats.totalRevenue.toLocaleString()}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Active Contracts</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.activeContracts}</p>
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
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Pending Withdrawals</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.pendingWithdrawals}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Total Users</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalUsers}</p>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">Recent Contracts</h2>
                  <div className="space-y-3">
                    {contracts.slice(0, 5).map((contract) => (
                      <div key={contract.id} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{contract.channel_name}</p>
                          <p className="text-xs text-gray-400">{contract.client_email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6">
                  <h2 className="text-xl font-bold mb-4">Pending Withdrawals</h2>
                  <div className="space-y-3">
                    {withdrawals.filter(w => w.status === 'pending').slice(0, 5).map((withdrawal) => (
                      <div key={withdrawal.id} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{withdrawal.worker_name}</p>
                          <p className="text-xs text-gray-400">₦{withdrawal.amount.toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                          {getStatusText(withdrawal.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contracts View - Continues in next section due to length */}
          {activeTab === 'contracts' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Contracts Management</h1>

              {contracts.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No contracts yet</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Client</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Campaign</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Link</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Progress</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.map((contract) => (
                            <tr key={contract.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-semibold">{contract.client_email}</p>
                                <p className="text-xs text-gray-400">₦{contract.total_amount.toLocaleString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {contract.channel_image ? (
                                    <img src={contract.channel_image} alt="" className="w-10 h-10 rounded-full" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                      <Play className="h-5 w-5" />
                                    </div>
                                  )}
                                  <span className="font-semibold">{contract.channel_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <a
                                  href={contract.channel_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                                >
                                  View
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                                  {getStatusText(contract.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="w-32">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-gray-400">{calculateProgress(contract).toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                                      style={{ width: `${calculateProgress(contract)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {contract.status === 'pending_payment' && (
                                    <>
                                      <button
                                        onClick={() => handleContractAction(contract.id, 'active')}
                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer"
                                        title="Approve"
                                      >
                                        <Check className="h-4 w-4 text-green-400" />
                                      </button>
                                      <button
                                        onClick={() => handleContractAction(contract.id, 'cancelled')}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                                        title="Decline"
                                      >
                                        <Ban className="h-4 w-4 text-red-400" />
                                      </button>
                                    </>
                                  )}
                                  {contract.status === 'active' && (
                                    <button
                                      onClick={() => handleContractAction(contract.id, 'cancelled')}
                                      className="p-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-all cursor-pointer"
                                      title="Pause"
                                    >
                                      <Pause className="h-4 w-4 text-yellow-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openChatForContract(contract)}
                                    className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
                                    title="Chat"
                                  >
                                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                    {contracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          {contract.channel_image ? (
                            <img src={contract.channel_image} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Play className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{contract.channel_name}</h3>
                            <p className="text-sm text-gray-400">{contract.client_email}</p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                              {getStatusText(contract.status)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Link:</span>
                            <a
                              href={contract.channel_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer text-sm"
                            >
                              View Channel
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-400">Progress:</span>
                              <span className="text-sm text-cyan-400">{calculateProgress(contract).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${calculateProgress(contract)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            {contract.status === 'pending_payment' && (
                              <>
                                <button
                                  onClick={() => handleContractAction(contract.id, 'active')}
                                  className="flex-1 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <Check className="h-5 w-5 text-green-400" />
                                  <span className="text-green-400 font-semibold">Approve</span>
                                </button>
                                <button
                                  onClick={() => handleContractAction(contract.id, 'cancelled')}
                                  className="flex-1 p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <Ban className="h-5 w-5 text-red-400" />
                                  <span className="text-red-400 font-semibold">Decline</span>
                                </button>
                              </>
                            )}
                            {contract.status === 'active' && (
                              <button
                                onClick={() => handleContractAction(contract.id, 'cancelled')}
                                className="flex-1 p-3 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Pause className="h-5 w-5 text-yellow-400" />
                                <span className="text-yellow-400 font-semibold">Pause</span>
                              </button>
                            )}
                            <button
                              onClick={() => openChatForContract(contract)}
                              className="flex-1 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="h-5 w-5 text-cyan-400" />
                              <span className="text-cyan-400 font-semibold">Chat</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Task Verifications View */}
          {activeTab === 'task-verifications' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Task Verifications</h1>

              {completions.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No task completions yet</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Worker</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Channel</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Reward</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Completed</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completions.map((completion) => (
                            <tr key={completion.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-semibold">{completion.worker_name}</p>
                                <p className="text-xs text-gray-400">{completion.worker_email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {completion.channel_image && (
                                    <img
                                      src={completion.channel_image}
                                      alt={completion.channel_name || 'Channel'}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{completion.channel_name}</p>
                                    <a
                                      href={completion.channel_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                      View Channel
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-green-400">₦{completion.payout_amount.toLocaleString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm">{new Date(completion.completed_at).toLocaleDateString()}</p>
                                <p className="text-xs text-gray-400">{new Date(completion.completed_at).toLocaleTimeString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  completion.verified ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                                }`}>
                                  {completion.verified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {!completion.verified ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleVerifyCompletion(completion.id, true)}
                                      className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer"
                                      title="Approve & Pay Worker"
                                    >
                                      <Check className="h-4 w-4 text-green-400" />
                                    </button>
                                    <button
                                      onClick={() => handleVerifyCompletion(completion.id, false)}
                                      className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                                      title="Reject"
                                    >
                                      <XCircle className="h-4 w-4 text-red-400" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {completions.map((completion) => (
                      <div key={completion.id} className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            {completion.channel_image && (
                              <img
                                src={completion.channel_image}
                                alt={completion.channel_name || 'Channel'}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{completion.channel_name}</p>
                              <p className="text-xs text-gray-400">{completion.worker_name}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            completion.verified ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                          }`}>
                            {completion.verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Reward:</span>
                            <span className="font-semibold text-green-400">₦{completion.payout_amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Completed:</span>
                            <span>{new Date(completion.completed_at).toLocaleDateString()}</span>
                          </div>
                          <a
                            href={completion.channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
                          >
                            View Channel
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        {!completion.verified && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerifyCompletion(completion.id, true)}
                              className="flex-1 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check className="h-5 w-5 text-green-400" />
                              <span className="text-green-400 font-semibold">Approve & Pay</span>
                            </button>
                            <button
                              onClick={() => handleVerifyCompletion(completion.id, false)}
                              className="flex-1 p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <XCircle className="h-5 w-5 text-red-400" />
                              <span className="text-red-400 font-semibold">Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Withdrawals View - To be continued... */}
          {activeTab === 'withdrawals' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Withdrawals Management</h1>

              {withdrawals.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <Wallet className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No withdrawal requests yet</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Worker</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Withdrawal ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Amount</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Date</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map((withdrawal) => (
                            <tr key={withdrawal.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-semibold">{withdrawal.worker_name}</p>
                                <p className="text-xs text-gray-400">{withdrawal.worker_email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-mono">{withdrawal.id.slice(0, 8)}...</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold text-green-400">₦{withdrawal.amount.toLocaleString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                                  {getStatusText(withdrawal.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => viewWorkerProfile(withdrawal.worker_id)}
                                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all cursor-pointer"
                                    title="View Profile"
                                  >
                                    <User className="h-4 w-4 text-blue-400" />
                                  </button>
                                  {withdrawal.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleWithdrawalAction(withdrawal.id, 'paid')}
                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer"
                                        title="Approve"
                                      >
                                        <Check className="h-4 w-4 text-green-400" />
                                      </button>
                                      <button
                                        onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                                        title="Reject"
                                      >
                                        <XCircle className="h-4 w-4 text-red-400" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{withdrawal.worker_name}</p>
                              <p className="text-sm text-gray-400">{withdrawal.worker_email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(withdrawal.status)}`}>
                              {getStatusText(withdrawal.status)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Amount:</span>
                            <span className="font-semibold text-green-400">₦{withdrawal.amount.toLocaleString()}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Date:</span>
                            <span className="text-sm">{new Date(withdrawal.created_at).toLocaleDateString()}</span>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => viewWorkerProfile(withdrawal.worker_id)}
                              className="flex-1 p-3 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <User className="h-5 w-5 text-blue-400" />
                              <span className="text-blue-400 font-semibold">Profile</span>
                            </button>
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'paid')}
                                  className="flex-1 p-3 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <Check className="h-5 w-5 text-green-400" />
                                  <span className="text-green-400 font-semibold">Approve</span>
                                </button>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'rejected')}
                                  className="flex-1 p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                                >
                                  <XCircle className="h-5 w-5 text-red-400" />
                                  <span className="text-red-400 font-semibold">Reject</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Users View */}
          {activeTab === 'users' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Users Management</h1>

              {users.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <UsersIcon className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No users yet</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">User</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Role</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Wallet Balance</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Joined</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                      <User className="h-5 w-5" />
                                    </div>
                                  )}
                                  <span className="font-semibold">{user.full_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm">{user.email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-semibold">₦{user.wallet_balance.toLocaleString()}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-12 h-12 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <User className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{user.full_name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{user.email}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Wallet Balance:</span>
                            <span className="font-semibold">₦{user.wallet_balance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Joined:</span>
                            <span className="text-sm">{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Messages View - Same as client with admin perspective */}
          {activeTab === 'messages' && (
            <div className="fixed top-[72px] left-0 right-0 bottom-0 lg:left-64">
              <div className="h-full bg-slate-900/80 backdrop-blur-xl border-l border-blue-500/20 flex">
                {/* Contracts List Sidebar */}
                <div className={`${showMobileChatList ? 'w-full' : 'hidden'} md:block md:w-80 border-r border-gray-700 overflow-y-auto`}>
                  <div className="p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-lg">Contracts</h2>
                  </div>
                  {contracts.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No contracts yet</p>
                    </div>
                  ) : (
                    <div>
                      {contracts.map((contract) => (
                        <button
                          key={contract.id}
                          onClick={() => {
                            setSelectedContractForChat(contract);
                            setShowMobileChatList(false);
                            fetchMessages(contract.id);
                          }}
                          className={`w-full p-4 border-b border-gray-700/50 hover:bg-slate-800/50 transition-colors text-left cursor-pointer ${
                            selectedContractForChat?.id === contract.id ? 'bg-slate-800/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {contract.channel_image ? (
                              <img src={contract.channel_image} alt="" className="w-10 h-10 rounded-full" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Play className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{contract.channel_name}</h3>
                              <p className="text-xs text-gray-400 truncate">{contract.client_email}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Area */}
                <div className={`${!showMobileChatList ? 'w-full' : 'hidden'} md:flex md:flex-1 flex flex-col`}>
                  {!selectedContractForChat ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm md:text-base">Select a contract to view messages</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 md:p-6 border-b border-gray-700">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setShowMobileChatList(true)}
                            className="md:hidden p-2 hover:bg-slate-800 rounded-lg cursor-pointer"
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </button>
                          {selectedContractForChat.channel_image ? (
                            <img src={selectedContractForChat.channel_image} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                              <Play className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg md:text-xl font-bold">{selectedContractForChat.channel_name}</h2>
                            <p className="text-xs md:text-sm text-gray-400">{selectedContractForChat.client_email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">No messages yet.</p>
                          </div>
                        ) : (
                          <>
                            {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.is_from_client ? 'justify-start' : 'justify-end'}`}
                            >
                              <div
                                className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                                  msg.is_from_client
                                    ? 'bg-slate-800 text-gray-200'
                                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                }`}
                              >
                                {msg.media_url && (
                                  <div className="mb-2">
                                    {msg.media_type === 'image' ? (
                                      <img
                                        src={msg.media_url}
                                        alt="Shared image"
                                        className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer"
                                        onClick={() => window.open(msg.media_url, '_blank')}
                                      />
                                    ) : (
                                      <video
                                        src={msg.media_url}
                                        controls
                                        className="rounded-lg max-w-full h-auto max-h-64"
                                      />
                                    )}
                                  </div>
                                )}
                                <p className="text-sm mb-1">{msg.message}</p>
                                <span className="text-xs opacity-70">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 md:p-6 border-t border-gray-700">
                        {/* File Preview */}
                        {selectedFile && (
                          <div className="mb-3 flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                            {selectedFile.type.startsWith('image/') ? (
                              <ImageIcon className="h-5 w-5 text-purple-400" />
                            ) : (
                              <Video className="h-5 w-5 text-purple-400" />
                            )}
                            <span className="text-sm text-gray-300 flex-1 truncate">{selectedFile.name}</span>
                            <button
                              onClick={() => setSelectedFile(null)}
                              className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        )}

                        <div className="flex gap-2 md:gap-3">
                          {/* File Upload Button */}
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setSelectedFile(file);
                            }}
                            className="hidden"
                            id="admin-file-upload"
                          />
                          <label
                            htmlFor="admin-file-upload"
                            className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 border border-gray-700 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                          >
                            <Paperclip className="h-5 w-5 text-gray-400" />
                          </label>

                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !uploading && handleSendMessage()}
                            placeholder="Type your message..."
                            disabled={uploading}
                            className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm md:text-base disabled:opacity-50"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={(!newMessage.trim() && !selectedFile) || uploading}
                            className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                          >
                            {uploading ? (
                              <>
                                <div className="animate-spin h-4 w-4 md:h-5 md:w-5 border-2 border-white border-t-transparent rounded-full" />
                                <span className="hidden sm:inline">Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden sm:inline">Send</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Worker Profile Modal */}
      <AnimatePresence>
        {showWorkerProfileModal && selectedWorker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWorkerProfileModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 max-w-md w-full"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-6">Worker Profile</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedWorker.avatar_url ? (
                    <img src={selectedWorker.avatar_url} alt="" className="w-16 h-16 rounded-full" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{selectedWorker.full_name}</h3>
                    <p className="text-sm text-gray-400">{selectedWorker.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Role</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(selectedWorker.role)}`}>
                      {selectedWorker.role.charAt(0).toUpperCase() + selectedWorker.role.slice(1)}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Wallet Balance</p>
                    <p className="text-xl font-bold text-green-400">₦{selectedWorker.wallet_balance.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Member Since</p>
                    <p className="text-sm">{new Date(selectedWorker.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowWorkerProfileModal(false)}
                  className="w-full mt-6 px-6 py-3 bg-slate-800 rounded-lg font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-lg min-w-[280px] md:min-w-[300px] ${
                notification.type === 'success'
                  ? 'bg-green-500/90 backdrop-blur-sm'
                  : notification.type === 'error'
                  ? 'bg-red-500/90 backdrop-blur-sm'
                  : 'bg-blue-500/90 backdrop-blur-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                {notification.type === 'success' && <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                {notification.type === 'error' && <XCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                {notification.type === 'info' && <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                <p className="font-semibold text-sm md:text-base">{notification.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
