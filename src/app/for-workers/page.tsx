'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wallet, Users, Clock, TrendingUp, CheckCircle2, ArrowRight, Zap, Shield } from 'lucide-react';
import { WORKER_PAYOUT_PER_TASK } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';
import Navbar from '@/components/Navbar';

export default function WorkerLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Header */}
      <Navbar type="landing" role="worker" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6"
            >
              <Wallet className="h-4 w-4 text-blue-400" />
              <span className="text-sm bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">500+ Active Workers Earning Daily</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display">
              <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                Earn Money From
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Your Phone
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Get paid <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{formatCurrency(WORKER_PAYOUT_PER_TASK)}</span> for every YouTube subscription task you complete. Work on your own schedule, withdraw anytime.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup/worker"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-2xl shadow-blue-500/30"
              >
                Start Earning Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
          >
            {[
              { value: '₦120', label: 'Per Task' },
              { value: '₦1,000', label: 'Min Withdrawal' },
              { value: '3 Days', label: 'Payment Time' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-xl p-6"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-20 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400">Start earning in 3 simple steps</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Sign Up Free', desc: 'Create your account with your email in under 2 minutes', step: 1 },
              { icon: CheckCircle2, title: 'Complete Tasks', desc: 'Subscribe to YouTube channels and verify your subscriptions', step: 2 },
              { icon: Wallet, title: 'Get Paid', desc: 'Withdraw your earnings anytime once you hit ₦1,000', step: 3 },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 h-full hover:border-blue-500 transition-all text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 mb-6 shadow-lg shadow-blue-500/50">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-blue-400 mb-2">Step {step.step}</div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Earnings Calculator */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Earnings Calculator
              </span>
            </h2>
            <p className="text-xl text-gray-400">See how much you can make</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { daily: 10, dailyEarning: 1200, monthlyEarning: 30000 },
              { daily: 20, dailyEarning: 2400, monthlyEarning: 60000 },
              { daily: 50, dailyEarning: 6000, monthlyEarning: 150000 },
            ].map((calc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-500/30 rounded-2xl p-8 text-center hover:border-blue-500 transition-all"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent mb-4">
                  ₦{calc.dailyEarning.toLocaleString()}
                </div>
                <div className="text-gray-300 text-lg mb-2">{calc.daily} tasks per day</div>
                <div className="text-3xl font-bold text-blue-400 mt-6 mb-2">
                  ₦{calc.monthlyEarning.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Per month (25 days)</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup/worker"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-2xl shadow-blue-500/30"
              >
                Start Earning Today
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Why Work With Us
              </span>
            </h2>
            <p className="text-xl text-gray-400">The best platform for Nigerian workers</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wallet, title: 'Earn ₦120 Per Task', desc: 'Fair payment for every verified subscription' },
              { icon: Clock, title: 'Work Anytime', desc: 'Complete tasks on your own schedule, 24/7' },
              { icon: Zap, title: 'Fast Withdrawals', desc: 'Get paid within 3 business days' },
              { icon: Shield, title: 'Secure & Reliable', desc: 'Safe platform with guaranteed payments' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-6 hover:border-blue-500 transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 mb-4">
                  <feature.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600">
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 font-display">
              Ready to Start Earning?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join 500+ Nigerian workers already earning money on Highzcore
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup/worker"
                className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-2xl"
              >
                Sign Up Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-blue-500/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Wallet className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-display">
                Highzcore
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Earn money by helping Nigerian creators grow their channels
            </p>
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Highzcore. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
