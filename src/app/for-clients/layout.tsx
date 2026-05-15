import { type ReactNode } from 'react';

// Layout is preserved only so the legacy redirect page renders cleanly.
// The actual content lives at /for-creators.
export const metadata = {
  title: 'For creators · Highzcore',
  alternates: { canonical: '/for-creators' },
  robots: { index: false, follow: false },
};

export default function LegacyForClientsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
