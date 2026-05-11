'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function FullLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
      className="relative flex items-center gap-3"
    >
      {/* Icon - YouTube Play + Growth Arrow */}
      <div className="relative">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur-md opacity-60" />

        {/* Icon container */}
        <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
          {/* YouTube Play Symbol */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10"
          >
            <path
              d="M8 5.14v14l11-7-11-7z"
              fill="white"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Growth Arrow Overlay */}
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-1 -right-1 bg-blue-400 rounded-full p-0.5"
          >
            <TrendingUp className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={3} />
          </motion.div>
        </div>
      </div>

      {/* Text Logo */}
      <motion.h1
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-2xl md:text-3xl font-black tracking-tight leading-none"
      >
        {/* Background text glow */}
        <span className="relative inline-block">
          <span className="absolute inset-0 blur-lg bg-gradient-to-r from-blue-500 to-blue-600 opacity-30"></span>

          {/* Main text with gradient */}
          <span className="relative bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-display">
            Highzcore
          </span>
        </span>
      </motion.h1>
    </motion.div>
  );
}
