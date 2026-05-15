import { type ReactNode } from 'react';

export const metadata = {
  title: 'Privacy Policy · Highzcore',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
