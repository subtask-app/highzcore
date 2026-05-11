'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
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
  BarChart3,
  Menu,
  X,
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Paperclip
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import FullLogo from '@/components/FullLogo';

type Contract = {
  id: string;
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

type Message = {
  id: string;
  contract_id: string;
  message: string;
  is_from_client: boolean;
  created_at: string;
  media_url?: string;
  media_type?: 'image' | 'video';
};

type Notification = {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'messages'>('dashboard');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedCampaignForChat, setSelectedCampaignForChat] = useState<Contract | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileChatList, setShowMobileChatList] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New order form
  const [orderForm, setOrderForm] = useState({
    channel_name: '',
    channel_url: '',
    channel_image: '',
    target_subscribers: '',
  });

  const router = useRouter();
  const supabase = createClient();

  const PRICE_PER_SUBSCRIBER = 150;

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

    const contractsChannel = supabase
      .channel('client-contracts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contracts'
        },
        (payload) => {
          console.log('Contract update:', payload);
          fetchDashboardData();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message update:', payload);
          if (selectedCampaignForChat && payload.new?.contract_id === selectedCampaignForChat.id) {
            fetchMessages(selectedCampaignForChat.id);
          }
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedCampaignForChat]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login/client');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      showNotification('error', 'Profile not found');
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

      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContracts(contractsData || []);
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

  const handleCreateOrder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const targetSubs = parseInt(orderForm.target_subscribers);
      if (!orderForm.channel_name || !orderForm.channel_url || !targetSubs) {
        showNotification('error', 'Please fill in all required fields');
        return;
      }

      const totalAmount = targetSubs * PRICE_PER_SUBSCRIBER;

      const { error } = await supabase.from('contracts').insert({
        client_id: user.id,
        channel_name: orderForm.channel_name,
        channel_url: orderForm.channel_url,
        channel_image: orderForm.channel_image || null,
        target_subscribers: targetSubs,
        current_subscribers: 0,
        price_per_subscriber: PRICE_PER_SUBSCRIBER,
        total_amount: totalAmount,
        status: 'pending_payment',
      });

      if (error) throw error;

      showNotification('success', 'Campaign created successfully!');
      setShowNewOrderModal(false);
      setOrderForm({
        channel_name: '',
        channel_url: '',
        channel_image: '',
        target_subscribers: '',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification('error', 'Failed to create campaign');
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
    if ((!newMessage.trim() && !selectedFile) || !selectedCampaignForChat) return;

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
        contract_id: selectedCampaignForChat.id,
        sender_id: user.id,
        message: newMessage.trim() || (mediaType === 'image' ? 'Sent an image' : 'Sent a video'),
        is_from_client: true,
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

  const openChatForCampaign = (contract: Contract) => {
    setSelectedCampaignForChat(contract);
    setActiveTab('messages');
    setShowMobileChatList(false);
    fetchMessages(contract.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10';
      case 'completed': return 'text-blue-400 bg-blue-500/10';
      case 'pending_payment': return 'text-yellow-400 bg-yellow-500/10';
      case 'cancelled': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'Pending Payment';
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const calculateProgress = (contract: Contract) => {
    if (contract.target_subscribers === 0) return 0;
    return Math.min(100, (contract.current_subscribers / contract.target_subscribers) * 100);
  };

  const stats = {
    totalCampaigns: contracts.length,
    activeCampaigns: contracts.filter(c => c.status === 'active').length,
    completedCampaigns: contracts.filter(c => c.status === 'completed').length,
    totalSpent: contracts.reduce((sum, c) => sum + c.total_amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
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
                      <p className="text-xs text-cyan-400 mt-1">Client Account</p>
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
              onClick={() => setActiveTab('campaigns')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-semibold">Campaigns</span>
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

          <button
            onClick={() => setShowNewOrderModal(true)}
            className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>
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
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setShowMobileSidebar(false);
                    }}
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
                    onClick={() => {
                      setActiveTab('campaigns');
                      setShowMobileSidebar(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'campaigns'
                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                        : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="font-semibold">Campaigns</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('messages');
                      setShowMobileSidebar(false);
                      setShowMobileChatList(true);
                    }}
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

                <button
                  onClick={() => {
                    setShowNewOrderModal(true);
                    setShowMobileSidebar(false);
                  }}
                  className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  New Campaign
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Dashboard</h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-cyan-500/10 rounded-xl">
                      <FileText className="h-5 w-5 md:h-6 md:w-6 text-cyan-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Total Campaigns</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalCampaigns}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Active Campaigns</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.activeCampaigns}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Completed</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.completedCampaigns}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-purple-400" />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs md:text-sm mb-1">Total Spent</p>
                  <p className="text-xl md:text-3xl font-bold">₦{stats.totalSpent.toLocaleString()}</p>
                </motion.div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Recent Campaigns</h2>
                {contracts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No campaigns yet</p>
                    <button
                      onClick={() => setShowNewOrderModal(true)}
                      className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-all cursor-pointer"
                    >
                      Create Your First Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.slice(0, 5).map((contract) => (
                      <div
                        key={contract.id}
                        className="p-4 bg-slate-800/50 border border-gray-700 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          {contract.channel_image ? (
                            <img
                              src={contract.channel_image}
                              alt={contract.channel_name}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Play className="h-6 w-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{contract.channel_name}</h3>
                            <p className="text-sm text-gray-400">
                              {contract.current_subscribers} / {contract.target_subscribers} subscribers
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                            {getStatusText(contract.status)}
                          </span>
                          <p className="text-lg font-bold">₦{contract.total_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Campaigns View */}
          {activeTab === 'campaigns' && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Campaigns</h1>
                <button
                  onClick={() => setShowNewOrderModal(true)}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  New Campaign
                </button>
              </div>

              {contracts.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-8 md:p-12 text-center">
                  <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-6">No campaigns yet. Create your first campaign to get started!</p>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-all cursor-pointer"
                  >
                    Create Campaign
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden lg:block bg-slate-900/80 backdrop-blur-xl border border-blue-500/20 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-gray-700">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Campaign Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Link</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Targets</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Price</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Progress</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contracts.map((contract) => (
                            <tr key={contract.id} className="border-b border-gray-700/50 hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
                                  {getStatusText(contract.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {contract.channel_image ? (
                                    <img
                                      src={contract.channel_image}
                                      alt={contract.channel_name}
                                      className="w-10 h-10 rounded-full"
                                    />
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
                                  View Channel
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-300">
                                  {contract.current_subscribers} / {contract.target_subscribers}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="font-semibold">₦{contract.total_amount.toLocaleString()}</span>
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
                                <button
                                  onClick={() => openChatForCampaign(contract)}
                                  className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer"
                                  title="Open chat"
                                >
                                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                                </button>
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
                            <img
                              src={contract.channel_image}
                              alt={contract.channel_name}
                              className="w-12 h-12 rounded-full flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                              <Play className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg mb-1">{contract.channel_name}</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(contract.status)}`}>
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

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Targets:</span>
                            <span className="text-sm">
                              {contract.current_subscribers} / {contract.target_subscribers}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Price:</span>
                            <span className="font-semibold">₦{contract.total_amount.toLocaleString()}</span>
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

                          <button
                            onClick={() => openChatForCampaign(contract)}
                            className="w-full mt-2 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="h-5 w-5 text-cyan-400" />
                            <span className="text-cyan-400 font-semibold">Open Chat</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Messages View */}
          {activeTab === 'messages' && (
            <div className="fixed top-[72px] left-0 right-0 bottom-0 lg:left-64">
              <div className="h-full bg-slate-900/80 backdrop-blur-xl border-l border-blue-500/20 flex">
                {/* Campaign List Sidebar - Responsive */}
                <div className={`${showMobileChatList ? 'w-full' : 'hidden'} md:block md:w-80 border-r border-gray-700 overflow-y-auto`}>
                  <div className="p-4 border-b border-gray-700">
                    <h2 className="font-semibold text-lg">Campaigns</h2>
                  </div>
                  {contracts.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">No campaigns yet</p>
                    </div>
                  ) : (
                    <div>
                      {contracts.map((contract) => (
                        <button
                          key={contract.id}
                          onClick={() => {
                            setSelectedCampaignForChat(contract);
                            setShowMobileChatList(false);
                            fetchMessages(contract.id);
                          }}
                          className={`w-full p-4 border-b border-gray-700/50 hover:bg-slate-800/50 transition-colors text-left cursor-pointer ${
                            selectedCampaignForChat?.id === contract.id ? 'bg-slate-800/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {contract.channel_image ? (
                              <img
                                src={contract.channel_image}
                                alt={contract.channel_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <Play className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{contract.channel_name}</h3>
                              <span className={`text-xs ${getStatusColor(contract.status)} px-2 py-0.5 rounded-full`}>
                                {getStatusText(contract.status)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat Area - Responsive */}
                <div className={`${!showMobileChatList ? 'w-full' : 'hidden'} md:flex md:flex-1 flex flex-col`}>
                  {!selectedCampaignForChat ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm md:text-base">Select a campaign to view messages</p>
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
                          {selectedCampaignForChat.channel_image ? (
                            <img
                              src={selectedCampaignForChat.channel_image}
                              alt={selectedCampaignForChat.channel_name}
                              className="w-10 h-10 md:w-12 md:h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                              <Play className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg md:text-xl font-bold">{selectedCampaignForChat.channel_name}</h2>
                            <p className="text-xs md:text-sm text-gray-400">Chat with admin about this campaign</p>
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                          </div>
                        ) : (
                          <>
                            {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.is_from_client ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 md:py-3 rounded-2xl ${
                                  msg.is_from_client
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                                    : 'bg-slate-800 text-gray-200'
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
                              <ImageIcon className="h-5 w-5 text-cyan-400" />
                            ) : (
                              <Video className="h-5 w-5 text-cyan-400" />
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
                            id="file-upload"
                          />
                          <label
                            htmlFor="file-upload"
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
                            className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
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

      {/* Mobile New Campaign FAB */}
      <button
        onClick={() => setShowNewOrderModal(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full shadow-lg flex items-center justify-center hover:from-cyan-600 hover:to-cyan-700 transition-all cursor-pointer z-30"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {/* New Campaign Modal */}
      <AnimatePresence>
        {showNewOrderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewOrderModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Create New Campaign</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Channel Name *</label>
                  <input
                    type="text"
                    value={orderForm.channel_name}
                    onChange={(e) => setOrderForm({ ...orderForm, channel_name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Enter YouTube channel name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Channel URL *</label>
                  <input
                    type="url"
                    value={orderForm.channel_url}
                    onChange={(e) => setOrderForm({ ...orderForm, channel_url: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://youtube.com/@channel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Channel Image URL (Optional)</label>
                  <input
                    type="url"
                    value={orderForm.channel_image}
                    onChange={(e) => setOrderForm({ ...orderForm, channel_image: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Target Subscribers *</label>
                  <input
                    type="number"
                    value={orderForm.target_subscribers}
                    onChange={(e) => setOrderForm({ ...orderForm, target_subscribers: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    placeholder="100"
                  />
                </div>

                {orderForm.target_subscribers && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      ₦{(parseInt(orderForm.target_subscribers) * PRICE_PER_SUBSCRIBER).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ₦{PRICE_PER_SUBSCRIBER} per subscriber
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 rounded-lg font-semibold hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all cursor-pointer"
                >
                  Create Campaign
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
