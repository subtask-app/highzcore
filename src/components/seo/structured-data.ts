// schema.org generators for JSON-LD. Keep these pure — they return plain
// JSON-compatible objects that `<JsonLd>` serialises into a script tag.
//
// Validate against https://search.google.com/test/rich-results before
// believing them; an invalid schema is silently ignored by Google.

import { PRICING_PACKAGES, WORKER_PAYOUT_PER_TASK } from '@/lib/constants';

// ── Organization ───────────────────────────────────────────────────────────

export function organizationSchema(siteUrl: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
    logo: `${siteUrl}/android-chrome-512x512.png`,
    description:
      'Real YouTube subscribers from real people, verified by YouTube\'s Data API. Highzcore connects channel owners with workers globally.',
    sameAs: [
      // Add your social profiles here as you create them:
      'https://t.me/HighzcoreOfficial_bot',
      'https://t.me/HighzcoreChannel',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English'],
      url: 'https://t.me/HighzcoreOfficial_bot',
    },
  };
}

// ── WebSite (with SearchAction so Google may show a sitelinks searchbox) ──

export function websiteSchema(siteUrl: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteUrl,
    inLanguage: 'en-US',
  };
}

// ── Service / Product line for /for-clients ────────────────────────────────

export function clientsServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'YouTube subscriber growth (verified)',
    serviceType: 'YouTube channel growth',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    description:
      'Reach the 1,000-subscriber YouTube monetization threshold with real subscribers from real Google accounts. Every subscription is verified through YouTube\'s Data API in real time.',
    offers: PRICING_PACKAGES.map((pkg) => ({
      '@type': 'Offer',
      name: `${pkg.name} — ${pkg.subscribers.toLocaleString()} subscribers`,
      url: `${siteUrl}/signup/client?package=${pkg.subscribers}`,
      price: pkg.price,
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      eligibleQuantity: { '@type': 'QuantitativeValue', value: pkg.subscribers, unitText: 'subscribers' },
    })),
  };
}

// ── JobPosting-style service for /for-workers ──────────────────────────────
// Not a JobPosting per Google's definition (gig vs. role), but a SimpleService
// gives crawlers a clear value proposition.

export function workersServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Earn cash for YouTube subscription tasks',
    serviceType: 'Online microtask earnings',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    description: `Earn ₦${WORKER_PAYOUT_PER_TASK} for each verified YouTube subscription you complete from your Google account. Work anywhere, withdraw anytime.`,
    audience: { '@type': 'Audience', audienceType: 'Adults seeking flexible side income' },
  };
}

// ── FAQ schema (for-clients + for-workers) ────────────────────────────────
// The schema-aware result Google may render directly in search.

export function faqSchema(items: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// ── BreadcrumbList ─────────────────────────────────────────────────────────

export function breadcrumbSchema(crumbs: ReadonlyArray<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}
