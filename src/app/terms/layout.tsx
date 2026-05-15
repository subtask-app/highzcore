import { type ReactNode } from 'react';

export const metadata = {
  title: 'Terms of Service · Highzcore',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
