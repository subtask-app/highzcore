'use client';

import { motion } from 'framer-motion';
import { Play, Users, TrendingUp, Zap } from 'lucide-react';

export default function HeroIllustration() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Main YouTube Play Button Circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 -m-12 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 blur-2xl"
        />

        {/* Middle ring */}
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="relative w-64 h-64 rounded-full border-4 border-dashed border-blue-500/30"
        >
          {/* Animated orbit dots */}
          {[0, 90, 180, 270].map((angle, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.5,
                repeat: Infinity,
              }}
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${angle}deg) translateX(8rem) translateY(-50%)`,
              }}
            />
          ))}
        </motion.div>

        {/* Central YouTube button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 shadow-2xl shadow-blue-500/50 flex items-center justify-center cursor-pointer"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Play className="h-20 w-20 text-white fill-white ml-2" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating stat cards */}
      {/* Subscribers card - top right */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="absolute top-12 right-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">1,000+</div>
            <div className="text-xs text-gray-400">Subscribers</div>
          </div>
        </div>
        {/* Animated progress bar */}
        <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1, duration: 2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
          />
        </div>
      </motion.div>

      {/* Growth trending card - top left */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="absolute top-24 left-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-400" />
          <div className="text-green-400 font-bold">+350%</div>
        </div>
        <div className="text-xs text-gray-400 mt-1">Growth Rate</div>
        {/* Animated chart lines */}
        <div className="flex items-end gap-1 mt-2 h-8">
          {[40, 55, 45, 70, 85, 75, 95].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-sm"
            />
          ))}
        </div>
      </motion.div>

      {/* Earnings card - bottom right */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        whileHover={{ scale: 1.05, y: -5 }}
        className="absolute bottom-24 right-16 bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <div className="text-yellow-400 font-bold">₦2M+</div>
        </div>
        <div className="text-xs text-gray-400 mt-1">Total Paid Out</div>
        {/* Animated coins */}
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ y: 0, opacity: 0 }}
              animate={{
                y: [0, -10, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                delay: 1.5 + i * 0.2,
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg"
            />
          ))}
        </div>
      </motion.div>

      {/* Verification checkmark - bottom left */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        whileHover={{ scale: 1.05, rotate: 5 }}
        className="absolute bottom-32 left-12 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-sm"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center"
          >
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.path
                d="M4 10l4 4 8-8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          </motion.div>
          <div>
            <div className="text-blue-400 font-bold text-sm">Verified</div>
            <div className="text-xs text-gray-400">Real Users</div>
          </div>
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -50, -100],
            x: Math.random() * 40 - 20,
          }}
          transition={{
            duration: 3,
            delay: i * 0.4,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-sm"
          style={{
            left: `${20 + i * 10}%`,
            bottom: '20%',
          }}
        />
      ))}
    </div>
  );
}
