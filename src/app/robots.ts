import type { MetadataRoute } from 'next';

// /robots.txt — emitted by Next at build time.
// Disallows everything behind auth + API; everything else is fair game.

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/auth/',
          '/login/',
          '/signup/',
        ],
      },
      // Be explicit with the major engines — some respect googlebot rules
      // differently than the wildcard.
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/auth/', '/login/', '/signup/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
