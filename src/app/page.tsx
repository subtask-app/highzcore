'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUp, Wallet, ArrowRight, Users, Play } from 'lucide-react';

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Main Content */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display"
          >
            <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
              Join Highzcore
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Choose Your Path
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Select how you want to use Highzcore
          </motion.p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Client Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <Link href="/for-clients">
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 rounded-2xl p-8 h-full hover:border-blue-500 transition-all cursor-pointer">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 mb-6 shadow-lg shadow-blue-500/50">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-3xl font-bold mb-4">I'm a Creator</h2>
                <p className="text-gray-400 text-lg mb-6">
                  I want to grow my YouTube channel and reach 1,000 subscribers for monetization
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <Play className="h-5 w-5 text-blue-400 mr-3" />
                    Get real subscribers
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Users className="h-5 w-5 text-blue-400 mr-3" />
                    Reach monetization faster
                  </li>
                  <li className="flex items-center text-gray-300">
                    <TrendingUp className="h-5 w-5 text-blue-400 mr-3" />
                    Track your growth
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                  Continue as Creator
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Worker Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            whileHover={{ y: -10 }}
            className="group relative"
          >
            <Link href="/for-workers">
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 rounded-2xl p-8 h-full hover:border-blue-500 transition-all cursor-pointer">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 mb-6 shadow-lg shadow-blue-500/50">
                  <Wallet className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-3xl font-bold mb-4">I'm a Worker</h2>
                <p className="text-gray-400 text-lg mb-6">
                  I want to earn money by subscribing to YouTube channels
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-300">
                    <Wallet className="h-5 w-5 text-blue-400 mr-3" />
                    Earn ₦120 per task
                  </li>
                  <li className="flex items-center text-gray-300">
                    <Users className="h-5 w-5 text-blue-400 mr-3" />
                    Work on your schedule
                  </li>
                  <li className="flex items-center text-gray-300">
                    <TrendingUp className="h-5 w-5 text-blue-400 mr-3" />
                    Withdraw anytime
                  </li>
                </ul>

                {/* CTA */}
                <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300 transition-colors">
                  Continue as Worker
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
