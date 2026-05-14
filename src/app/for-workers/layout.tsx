import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  faqSchema,
  workersServiceSchema,
} from '@/components/seo/structured-data';
import { WORKER_FAQS } from '@/lib/seo/faqs';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Earn money online — ₦120 per YouTube subscription task',
  description:
    'Get paid for every YouTube subscription you complete from your Google account. Work anywhere, withdraw anytime, no special skills required. Real money, real fast.',
  alternates: { canonical: `${SITE_URL}/for-workers` },
  openGraph: {
    title: 'Earn money online — ₦120 per YouTube subscription task',
    description:
      'Get paid for every YouTube subscription you complete from your Google account. Work anywhere, withdraw anytime.',
    url: `${SITE_URL}/for-workers`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Earn money online — ₦120 per YouTube subscription task',
    description:
      'Get paid for every YouTube subscription you complete. Real money, real fast.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        id="ld-workers-service"
        data={workersServiceSchema(SITE_URL)}
      />
      <JsonLd
        id="ld-workers-faq"
        data={faqSchema(WORKER_FAQS)}
      />
      <JsonLd
        id="ld-workers-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'For Workers', url: `${SITE_URL}/for-workers` },
        ])}
      />
      {children}
    </>
  );
}
