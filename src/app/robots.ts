import type { MetadataRoute } from 'next';

// /robots.txt — disallow auth-gated and API routes. Everything else is
// fair game for crawlers.

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
  const disallow = [
    '/api/',
    '/admin/',
    '/creator/',
    '/worker/',
    '/dashboard/',
    '/auth/',
    '/onboarding/',
    '/post-login',
    '/design-system',
  ];
  return {
    rules: [
      { userAgent: '*',          allow: '/', disallow },
      { userAgent: 'Googlebot',  allow: '/', disallow },
      { userAgent: 'Bingbot',    allow: '/', disallow },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
