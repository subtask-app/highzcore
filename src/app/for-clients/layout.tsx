import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  clientsServiceSchema,
  faqSchema,
} from '@/components/seo/structured-data';
import { CREATOR_FAQS } from '@/lib/seo/faqs';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'Buy real YouTube subscribers — hit 1,000 and monetize',
  description:
    'Reach the 1,000-subscriber YouTube monetization threshold with real people, not bots. Every subscription is verified by YouTube\'s Data API. Pricing from 100 to 2,000+ subscribers.',
  alternates: { canonical: `${SITE_URL}/for-clients` },
  openGraph: {
    title: 'Buy real YouTube subscribers — hit 1,000 and monetize',
    description:
      'Reach the 1,000-subscriber YouTube monetization threshold with real people, not bots. Every subscription is verified by YouTube\'s Data API.',
    url: `${SITE_URL}/for-clients`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy real YouTube subscribers — hit 1,000 and monetize',
    description:
      'Real subscribers, verified by YouTube\'s API. Pricing from 100 to 2,000+ subscribers.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        id="ld-clients-service"
        data={clientsServiceSchema(SITE_URL)}
      />
      <JsonLd
        id="ld-clients-faq"
        data={faqSchema(CREATOR_FAQS)}
      />
      <JsonLd
        id="ld-clients-crumbs"
        data={breadcrumbSchema([
          { name: 'Home', url: `${SITE_URL}/` },
          { name: 'For Creators', url: `${SITE_URL}/for-clients` },
        ])}
      />
      {children}
    </>
  );
}
