'use client';

import { useEffect, useRef } from 'react';

/**
 * Tracks normalized document scroll progress (0..1).
 *
 * Returns a ref instead of state on purpose: we want react-three-fiber's
 * `useFrame` to read this every frame WITHOUT causing React re-renders.
 * Reading `ref.current` from inside useFrame is the canonical R3F pattern.
 */
export function useScrollProgress() {
  const ref = useRef(0);

  useEffect(() => {
    const compute = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      ref.current = Math.min(1, Math.max(0, window.scrollY / max));
    };
    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute);
      window.removeEventListener('resize', compute);
    };
  }, []);

  return ref;
}
