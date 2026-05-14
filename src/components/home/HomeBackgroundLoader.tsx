'use client';

// Thin client boundary so we can `ssr: false` the R3F canvas.
// Renders the CSS preloader as the loading state until three.js arrives.

import dynamic from 'next/dynamic';
import Preloader from './Preloader';

const HomeBackground = dynamic(() => import('./HomeBackground'), {
  ssr: false,
  loading: () => <Preloader />,
});

export default function HomeBackgroundLoader() {
  return <HomeBackground />;
}
