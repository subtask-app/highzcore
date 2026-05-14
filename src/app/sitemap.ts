import type { MetadataRoute } from 'next';

// /sitemap.xml — emitted by Next at build time. Lists every public route
// crawlers should index. Auth pages, dashboards, and API routes are
// excluded (they're also blocked in robots.ts).

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
  const now = new Date();

  return [
    { url: `${base}/`,            lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/for-clients`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/for-workers`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/privacy`,     lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/terms`,       lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
