'use client';

// Marketing-page section primitives. The reveal pattern + Apple-style
// constraints come from DESIGN.md.

import { motion, type Variants } from 'framer-motion';
import { type ReactNode } from 'react';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

// ── Hero — oversized headline + supporting copy ─────────────────────────────
export function Hero({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('relative px-4 md:px-8 pt-16 md:pt-32 pb-16 md:pb-24', className)}>
      <div className="mx-auto max-w-[1100px] text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-6"
        >
          {eyebrow && (
            <motion.p variants={fadeUp} className="text-xs uppercase tracking-[0.18em] font-semibold text-brand">
              {eyebrow}
            </motion.p>
          )}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl lg:text-[96px] font-extrabold tracking-[-0.035em] leading-[1.02] text-fg"
          >
            {title}
          </motion.h1>
          {description && (
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-2xl text-lg md:text-xl text-fg-muted leading-relaxed"
            >
              {description}
            </motion.p>
          )}
          {actions && (
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {actions}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ── Reveal — scroll-driven section that fades up into view ─────────────────
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function Reveal({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={sectionVariants}
      className={cn('px-4 md:px-8 py-16 md:py-24', className)}
    >
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </motion.section>
  );
}

// ── Section heading — narrow, oversized, optional eyebrow ──────────────────
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === 'center' ? 'text-center max-w-[760px] mx-auto' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-brand mb-3">{eyebrow}</p>
      )}
      <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] leading-[1.05] text-fg">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-fg-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ── FeatureGrid — 3 or 4 small feature cards ──────────────────────────────
// `icon` is a pre-rendered ReactNode so server-component callers can pass
// <Sparkles /> directly without dragging a function reference across the
// server/client boundary.
export function FeatureGrid({
  items,
  className,
}: {
  items: { icon?: ReactNode; title: string; description: string }[];
  className?: string;
}) {
  return (
    <div className={cn('mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {items.map((it) => (
        <div key={it.title} className="rounded-xl border border-border bg-surface p-6">
          {it.icon && <span className="inline-flex text-brand">{it.icon}</span>}
          <h3 className="mt-3 text-lg font-semibold text-fg">{it.title}</h3>
          <p className="mt-1.5 text-sm text-fg-muted leading-relaxed">{it.description}</p>
        </div>
      ))}
    </div>
  );
}
