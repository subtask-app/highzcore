import { type ReactNode } from 'react';

export const metadata = {
  title: 'For workers · Highzcore',
  alternates: { canonical: '/for-workers' },
};

export default function ForWorkersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
