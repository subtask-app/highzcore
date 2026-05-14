import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The agreement that governs your use of Highzcore — for creators buying subscribers, workers completing tasks, and the marketplace that connects them.',
  alternates: { canonical: `${SITE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
