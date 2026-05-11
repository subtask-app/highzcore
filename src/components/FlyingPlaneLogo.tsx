'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function FlyingPlaneLogo() {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    // Repeat animation every 5 seconds
    const interval = setInterval(() => {
      setIsAnimating(false);
      setTimeout(() => setIsAnimating(true), 100);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-4 perspective-1000">
      {/* Highzcore Text with modern font */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
          <span className="relative inline-block">
            {/* Background glow */}
            <span className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 opacity-40"></span>

            {/* Main text with gradient */}
            <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent font-display">
              Highzcore
            </span>
          </span>
        </h1>

        {/* Animated underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full mt-1 origin-left"
        />
      </motion.div>

      {/* Flying Plane Animation */}
      {isAnimating && (
        <motion.div
          initial={{ x: -150, y: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: 300,
            y: [-10, -20, -15, -25, -10],
            rotate: [0, -5, 5, -3, 0],
            opacity: [0, 1, 1, 1, 0]
          }}
          transition={{
            duration: 3,
            ease: "easeInOut",
            times: [0, 0.2, 0.5, 0.8, 1]
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          {/* Paper Plane SVG */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
          >
            {/* Plane body */}
            <motion.path
              d="M2.5 12L22 2L17 12L22 22L2.5 12Z"
              fill="url(#planeGradient)"
              stroke="white"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Wing detail */}
            <motion.path
              d="M7 12L17 12"
              stroke="white"
              strokeWidth="1"
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            />
            <defs>
              <linearGradient id="planeGradient" x1="2.5" y1="12" x2="22" y2="12">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>

          {/* Plane trail effect */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: [0, 0.6, 0] }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute right-full top-1/2 -translate-y-1/2 h-0.5 w-24 bg-gradient-to-r from-transparent via-purple-400 to-purple-600 origin-right"
          />
        </motion.div>
      )}

      {/* Sparkle effects */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              repeatDelay: 1
            }}
            className="absolute"
            style={{
              left: `${20 + i * 30}%`,
              top: `${20 + i * 15}%`,
            }}
          >
            <div className="w-1 h-1 bg-purple-400 rounded-full blur-[1px]"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
