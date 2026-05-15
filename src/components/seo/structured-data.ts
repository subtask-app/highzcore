// schema.org generators for JSON-LD. Pure functions; <JsonLd> serialises
// them into <script type="application/ld+json"> tags in <head>.
//
// Validate against https://search.google.com/test/rich-results before
// trusting any of these — invalid schema is silently dropped by Google.

import { INSIGHTS_TIERS } from '@/lib/insights/pricing';
import { ABTEST_TIERS } from '@/lib/abtest/pricing';
import { PROMOTE_TIERS } from '@/lib/promote/pricing';

// ── Organization ──────────────────────────────────────────────────────────
export function organizationSchema(siteUrl: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
    logo: `${siteUrl}/android-chrome-512x512.png`,
    description:
      'Highzcore is a creator growth platform that connects YouTube creators with real, paid audiences in Southeast Asia and Africa for paid feedback, paid testing, paid promotion, and paid collabs — backed by real data.',
    sameAs: [
      'https://t.me/HighzcoreOfficial_bot',
      'https://t.me/HighzcoreChannel',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      availableLanguage: ['English'],
      email: 'hello@highzcore.tech',
      url: `${siteUrl}/contact`,
    },
  };
}

// ── WebSite (with SearchAction for the sitelinks searchbox) ──
export function websiteSchema(siteUrl: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: siteUrl,
    inLanguage: 'en-US',
    publisher: { '@type': 'Organization', name },
  };
}

// ── Service schemas — one per product ────────────────────────────────────
export function insightsServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Audience Insights — real-people pre-publication feedback for YouTube videos',
    serviceType: 'Audience research',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    description:
      'Real people in your target demographic watch your YouTube video and answer structured questions before you publish. Get sub-likelihood, retention drop-offs, and verbatim feedback in under 24 hours.',
    offers: INSIGHTS_TIERS.map((t) => ({
      '@type': 'Offer',
      name: `${t.label} — ${t.responseCount} responses`,
      url: `${siteUrl}/products/insights`,
      price: t.totalUsd,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })),
  };
}

export function abtestServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Thumbnail & Title A/B Testing for YouTube creators',
    serviceType: 'Thumbnail testing',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    description:
      'Side-by-side click-test of 2–4 thumbnails or titles against your target audience. Statistically significant winner in under an hour.',
    offers: ABTEST_TIERS.map((t) => ({
      '@type': 'Offer',
      name: `${t.label} — ${t.voteCount} votes`,
      url: `${siteUrl}/products/abtest`,
      price: t.totalUsd,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })),
  };
}

export function promoteServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Promote — share your YouTube video to real audiences',
    serviceType: 'Affiliate promotion',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    description:
      "Workers with verified follower counts on X, Instagram, TikTok, Telegram, WhatsApp, Facebook, or YouTube share your video to their actual followers. Tracked via UTM in your YouTube Studio.",
    offers: PROMOTE_TIERS.map((t) => ({
      '@type': 'Offer',
      name: `${t.label} — ${t.shareCount} shares`,
      url: `${siteUrl}/products/promote`,
      price: t.totalUsd,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    })),
  };
}

export function collabServiceSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Collab Matchmaking for YouTube creators',
    serviceType: 'Creator-to-creator collab',
    provider: { '@type': 'Organization', name: 'Highzcore', url: siteUrl },
    description:
      'Find other creators in your niche for shoutouts, joint videos, joint live streams, or channel features. Two-sided escrow; both creators confirm completion.',
  };
}

// ── FAQ schema (rich result eligible) ──
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

// ── BreadcrumbList ────────────────────────────────────────────────────────
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

// ── Article (for blog posts) ─────────────────────────────────────────────
export function articleSchema(opts: {
  siteUrl: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  modifiedAt?: string;
  authorName?: string;
  imageUrl?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${opts.siteUrl}/blog/${opts.slug}` },
    headline: opts.title,
    description: opts.description,
    datePublished: opts.publishedAt,
    dateModified: opts.modifiedAt ?? opts.publishedAt,
    author: { '@type': 'Organization', name: opts.authorName ?? 'Highzcore' },
    publisher: {
      '@type': 'Organization',
      name: 'Highzcore',
      logo: { '@type': 'ImageObject', url: `${opts.siteUrl}/android-chrome-512x512.png` },
    },
    image: opts.imageUrl ?? `${opts.siteUrl}/og-image.png`,
  };
}
