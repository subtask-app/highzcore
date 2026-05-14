// Small set of presentational primitives shared by every marketing page so
// the typography, spacing, and surface treatment stay uniform.

import type { ReactNode } from 'react';
export { default as Button } from './Button';

// ── Eyebrow ──────────────────────────────────────────────────────────────────

export function Eyebrow({ children, tone = 'cyan' }: { children: ReactNode; tone?: 'cyan' | 'blue' }) {
  const color = tone === 'blue' ? 'text-blue-300/80' : 'text-cyan-300/80';
  return (
    <p className={`${color} text-xs md:text-sm font-semibold uppercase tracking-[0.3em]`}>
      {children}
    </p>
  );
}

// ── SectionHeading ───────────────────────────────────────────────────────────

interface SectionHeadingProps {
  /** Plain heading text. Wrap part of the text in <Highlight> for the gradient slice. */
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Use h1 instead of h2 (one allowed per page). */
  asH1?: boolean;
}

export function SectionHeading({ children, align = 'left', asH1 = false }: SectionHeadingProps) {
  const Tag = asH1 ? 'h1' : 'h2';
  const a = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <Tag className={`text-white text-4xl md:text-6xl font-black leading-[1.0] tracking-tight ${a}`}>
      {children}
    </Tag>
  );
}

/** Inline gradient slice for use inside SectionHeading. */
export function Highlight({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

// ── Lead paragraph ───────────────────────────────────────────────────────────

export function Lead({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'center' | 'right' }) {
  const a = align === 'center' ? 'text-center mx-auto' : align === 'right' ? 'text-right ml-auto' : 'text-left';
  return (
    <p className={`text-base md:text-lg text-white/70 max-w-2xl leading-relaxed ${a}`}>
      {children}
    </p>
  );
}

// ── Card (glassy surface) ────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode;
  tone?: 'cyan' | 'blue' | 'neutral';
  className?: string;
}

export function Card({ children, tone = 'neutral', className = '' }: CardProps) {
  const border =
    tone === 'cyan' ? 'border-cyan-500/20'
    : tone === 'blue' ? 'border-blue-500/20'
    : 'border-white/10';
  return (
    <div className={`bg-slate-900/50 backdrop-blur-md border ${border} rounded-2xl p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

// ── Section wrapper ─────────────────────────────────────────────────────────

export function Section({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`relative max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28 ${className}`}>
      {children}
    </section>
  );
}
