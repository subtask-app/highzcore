'use client';

// Hero3D — full hero composition. Server-rendered headline + CTAs sit
// above a 3D backdrop. Pages pass a `scene` preset name; the Stage handles
// device gating + fallback.

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Stage } from './Stage';
import { GradientMesh } from './scenes/GradientMesh';
import { ParticleField } from './scenes/ParticleField';
import { cn } from '@/lib/utils';

export type ScenePreset =
  | 'brand'      // cyan → blue (default homepage / for-creators / pricing / about)
  | 'insights'   // peach + rose
  | 'abtest'     // lavender
  | 'promote'    // green
  | 'collab'     // amber
  | 'calm'       // muted neutrals + slow particles (legal / help / contact)
  | 'subtle';    // very low intensity, used in ambient inner sections

const PRESETS: Record<ScenePreset, {
  colorA: string;
  colorB: string;
  particleColor: string;
  intensity: number;
  particleCount: number;
  fallback: string;
}> = {
  brand: {
    colorA: '#2bb9d2', colorB: '#1056c4',
    particleColor: '#5fd0e3', intensity: 0.55, particleCount: 900,
    fallback: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, #2bb9d2 18%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 80% 100%, color-mix(in srgb, #1056c4 16%, transparent) 0%, transparent 70%)',
  },
  insights: {
    colorA: '#ff8a5c', colorB: '#ff5d5c',
    particleColor: '#ffd0a0', intensity: 0.48, particleCount: 800,
    fallback: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, #ff8a5c 18%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 80% 100%, color-mix(in srgb, #ff5d5c 14%, transparent) 0%, transparent 70%)',
  },
  abtest: {
    colorA: '#a584ff', colorB: '#6c4fd9',
    particleColor: '#cdb6ff', intensity: 0.48, particleCount: 800,
    fallback: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, #a584ff 18%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 80% 100%, color-mix(in srgb, #6c4fd9 14%, transparent) 0%, transparent 70%)',
  },
  promote: {
    colorA: '#5bd68c', colorB: '#2bb95f',
    particleColor: '#a8eebf', intensity: 0.48, particleCount: 800,
    fallback: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, #5bd68c 18%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 80% 100%, color-mix(in srgb, #2bb95f 14%, transparent) 0%, transparent 70%)',
  },
  collab: {
    colorA: '#ffc857', colorB: '#f59e0b',
    particleColor: '#ffe09a', intensity: 0.48, particleCount: 800,
    fallback: 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, #ffc857 18%, transparent) 0%, transparent 60%), radial-gradient(80% 60% at 80% 100%, color-mix(in srgb, #f59e0b 14%, transparent) 0%, transparent 70%)',
  },
  calm: {
    colorA: '#3a4757', colorB: '#0099bf',
    particleColor: '#5fd0e3', intensity: 0.30, particleCount: 700,
    fallback: 'radial-gradient(100% 60% at 50% 0%, color-mix(in srgb, #0099bf 10%, transparent) 0%, transparent 70%)',
  },
  subtle: {
    colorA: '#0099bf', colorB: '#1056c4',
    particleColor: '#5fd0e3', intensity: 0.22, particleCount: 400,
    fallback: 'radial-gradient(60% 40% at 50% 50%, color-mix(in srgb, #0099bf 6%, transparent) 0%, transparent 80%)',
  },
};

export interface Hero3DProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  scene?: ScenePreset;
  className?: string;
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function Hero3D({
  eyebrow,
  title,
  description,
  actions,
  scene = 'brand',
  className,
}: Hero3DProps) {
  const preset = PRESETS[scene];

  return (
    <section className={cn(
      'relative isolate overflow-hidden px-4 md:px-8 pt-14 md:pt-32 pb-12 md:pb-28',
      className,
    )}>
      {/* 3D backdrop. Absolutely positioned, pointer-events:none in Stage. */}
      <Stage gradient={{ fallback: preset.fallback }}>
        <GradientMesh
          colorA={preset.colorA}
          colorB={preset.colorB}
          intensity={preset.intensity}
        />
        <ParticleField count={preset.particleCount} color={preset.particleColor} />
      </Stage>

      {/* Top + bottom gradient masks so content stays readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 100%)' }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }}
      />

      {/* Content layer. */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 mx-auto max-w-[1100px] text-center"
      >
        {eyebrow && (
          <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">
            {eyebrow}
          </motion.p>
        )}
        <motion.h1
          variants={fadeUp}
          className="mt-4 font-display text-[40px] sm:text-5xl md:text-7xl lg:text-[96px] font-extrabold tracking-[-0.035em] leading-[1.04] md:leading-[1.02] text-fg"
        >
          {title}
        </motion.h1>
        {description && (
          <motion.div
            variants={fadeUp}
            className="mx-auto mt-5 md:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-fg-muted leading-relaxed"
          >
            {description}
          </motion.div>
        )}
        {actions && (
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
