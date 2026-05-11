'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Play, Users, TrendingUp, Shield, CheckCircle2, ArrowRight, Sparkles, DollarSign } from 'lucide-react';
import { PRICING_PACKAGES } from '@/types/database.types';
import { formatCurrency, formatNumber, calculateTotalPrice } from '@/lib/utils';
import Navbar from '@/components/Navbar';

const HeroIllustration = dynamic(() => import('@/components/HeroIllustration'), { ssr: false });
const FloatingCards = dynamic(() => import('@/components/FloatingCards'), { ssr: false });

export default function ClientLandingPage() {
  const [subscriberCount, setSubscriberCount] = useState(1000);
  const calculatedPrice = calculateTotalPrice(subscriberCount);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      {/* Header */}
      <Navbar type="landing" role="client" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="relative z-10">
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
                <Sparkles className="h-4 w-4 text-blue-400" />
                <span className="text-sm bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent">Trusted by 500+ Nigerian Creators</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display">
                <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">
                  Grow Your YouTube
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Channel Faster
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Reach <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent font-semibold">1,000 subscribers</span> to monetize your channel. Highzcore connects you with <span className="bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent font-semibold">real people</span> who subscribe to your channel for a fair price.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/signup/client"
                    className="group bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/30"
                  >
                    Get Subscribers Now
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Trust Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="grid grid-cols-3 gap-6 mt-12"
            >
              {[
                { value: '10,000+', label: 'Subscribers Delivered' },
                { value: '500+', label: 'Happy Creators' },
                { value: '7-14 Days', label: 'Delivery Time' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right: Hero Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative h-[500px] lg:h-[600px]"
          >
            <HeroIllustration />
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
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400">Simple, transparent, and effective</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Choose Package', desc: 'Select how many subscribers you need', step: 1 },
              { icon: DollarSign, title: 'Make Payment', desc: 'Transfer and send proof of payment', step: 2 },
              { icon: TrendingUp, title: 'Track Progress', desc: 'Watch real-time subscriber growth', step: 3 },
              { icon: CheckCircle2, title: 'Reach Your Goal', desc: 'Unlock YouTube monetization', step: 4 },
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
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-6 h-full hover:border-blue-500 transition-all">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 mb-4">
                    <step.icon className="h-7 w-7 text-blue-400" />
                  </div>
                  <div className="text-sm font-semibold text-blue-400 mb-2">Step {step.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="relative py-20">
        <div className="absolute inset-0 h-[600px] opacity-30">
          <FloatingCards />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Transparent Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400">No hidden fees. Pay once, get results.</p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {PRICING_PACKAGES.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div
                  className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 rounded-2xl p-6 h-full transition-all ${
                    pkg.popular
                      ? 'border-blue-500 shadow-2xl shadow-blue-500/30'
                      : 'border-blue-500/30 hover:border-blue-500'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <motion.span
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg"
                      >
                        Most Popular
                      </motion.span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">{pkg.name}</h3>
                    <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent mb-1">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-gray-400 mb-6">{formatNumber(pkg.subscribers)} subscribers</div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href={`/signup/client?package=${pkg.subscribers}`}
                        className={`block w-full py-3 rounded-xl font-semibold transition-all ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-slate-700/50 text-white hover:bg-slate-700'
                        }`}
                      >
                        Get Started
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Custom Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl"
          >
            <h3 className="text-2xl font-bold mb-6 text-center font-display">
              Custom Package Calculator
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Number of Subscribers: <span className="text-blue-400 font-bold">{formatNumber(subscriberCount)}</span>
                </label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={subscriberCount}
                  onChange={(e) => setSubscriberCount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((subscriberCount - 100) / 4900) * 100}%, #334155 ${((subscriberCount - 100) / 4900) * 100}%, #334155 100%)`
                  }}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>100</span>
                  <span>5,000</span>
                </div>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-600/20 to-blue-500/20 border-2 border-blue-500 rounded-xl p-6"
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-300">Total Price:</span>
                  <span className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                    {formatCurrency(calculatedPrice)}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                  ₦150 per subscriber • Delivered within 7-14 days
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={`/signup/client?subscribers=${subscriberCount}`}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all text-center shadow-xl shadow-blue-500/50"
                >
                  Order {formatNumber(subscriberCount)} Subscribers
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Safety */}
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
                Safe & Trustworthy
              </span>
            </h2>
            <p className="text-xl text-gray-400">Built for Nigerians, trusted by thousands</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Real Subscriptions', desc: 'All subscriptions from real YouTube accounts. No bots or fake accounts.' },
              { icon: Play, title: 'Fast Delivery', desc: '7-14 day delivery with real-time tracking and progress updates.' },
              { icon: Users, title: 'Local Support', desc: 'Nigerian team providing support via chat and email.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -10 }}
                className="text-center bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-8 hover:border-blue-500 transition-all"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 mb-6">
                  <feature.icon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
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
              Ready to Reach 1,000 Subscribers?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join hundreds of Nigerian creators who have already unlocked YouTube monetization
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/signup/client"
                className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-2xl"
              >
                Get Started Now
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
              <Play className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-display">
                Highzcore
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Connecting Nigerian YouTube creators with real subscribers
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
