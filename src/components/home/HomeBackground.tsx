'use client';

import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import CameraRig from './scenes/CameraRig';
import Network from './scenes/Network';
import { useScrollProgress } from './useScrollProgress';
import { useReducedMotion } from './useReducedMotion';
import Preloader from './Preloader';
import HomeFallback from './HomeFallback';

// Fixed full-viewport 3D background. The HTML story (HomeContent) scrolls
// over the top in real DOM. Camera position is derived from scroll progress.
export default function HomeBackground() {
  const progressRef = useScrollProgress();
  const reduceMotion = useReducedMotion();

  // Lock the body background so the canvas never shows seams during overscroll.
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#020617'; // slate-950
    return () => { document.body.style.backgroundColor = prev; };
  }, []);

  if (reduceMotion) return <HomeFallback />;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.8, 8], fov: 50, near: 0.1, far: 100 }}
      >
        <color attach="background" args={['#020617']} />
        {/* Tighter fog: scene fades into darkness much sooner, so distant
            dots / nodes don't compete with foreground text. */}
        <fog attach="fog" args={['#020617', 5, 16]} />

        <Suspense fallback={null}>
          <CameraRig progressRef={progressRef} />
          <Network />
        </Suspense>
      </Canvas>

      {/* Readability scrim — sits between the canvas and the HTML content.
          Vertical gradient is darker at the section midline (where headlines
          live) and lighter in the middle of the canvas (where the orb lives),
          so the 3D still feels alive but text never has to fight bright dots. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgba(2,6,23,0.65) 0%, rgba(2,6,23,0.15) 35%, rgba(2,6,23,0.15) 65%, rgba(2,6,23,0.65) 100%)',
        }}
      />
    </div>
  );
}
