// Server component. The story copy (HomeContent) is SSR'd so search engines
// see every section. The 3D background is loaded client-side via a thin
// client boundary that's allowed to use `ssr: false`.

import HomeBackgroundLoader from '@/components/home/HomeBackgroundLoader';
import HomeContent from '@/components/home/HomeContent';

export default function HomePage() {
  return (
    <>
      <HomeBackgroundLoader />
      <HomeContent />
    </>
  );
}
