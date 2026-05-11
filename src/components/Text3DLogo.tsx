'use client';

import { motion } from 'framer-motion';

export default function Text3DLogo() {
  return (
    <div className="relative inline-block perspective-1000">
      {/* Main text with 3D effect */}
      <motion.div
        initial={{ rotateY: -20, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Multiple layers for 3D depth */}
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute inset-0 text-2xl font-extrabold tracking-tight"
            style={{
              transform: `translateZ(${-i * 2}px)`,
              color: i === 0 ? '#ffffff' : `rgba(139, 92, 246, ${0.8 - i * 0.1})`,
              WebkitTextStroke: i === 0 ? '1px rgba(139, 92, 246, 0.5)' : 'none',
              textShadow: i === 0
                ? '0 0 20px rgba(139, 92, 246, 0.8), 0 0 40px rgba(236, 72, 153, 0.4)'
                : 'none',
            }}
            aria-hidden={i !== 0}
          >
            Highzcore
          </span>
        ))}

        {/* Front layer (visible text) */}
        <motion.span
          animate={{
            textShadow: [
              '0 0 20px rgba(139, 92, 246, 0.8)',
              '0 0 40px rgba(236, 72, 153, 0.6)',
              '0 0 20px rgba(139, 92, 246, 0.8)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative block text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent font-display"
          style={{
            transform: 'translateZ(0px)',
            WebkitTextStroke: '1px rgba(139, 92, 246, 0.5)',
            filter: 'drop-shadow(0 4px 8px rgba(139, 92, 246, 0.4))',
          }}
        >
          Highzcore
        </motion.span>
      </motion.div>

      {/* Animated background glow */}
      <motion.div
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 blur-xl opacity-50 rounded-lg"
        style={{
          transform: 'translateZ(-20px) scale(1.2)',
        }}
      />
    </div>
  );
}
