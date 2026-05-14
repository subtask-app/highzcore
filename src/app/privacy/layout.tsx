import type { Metadata } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Highzcore collects, uses, and protects your data — including YouTube account permissions, payment information, and Telegram identifiers.',
  alternates: { canonical: `${SITE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
