import type { MetadataRoute } from 'next';

// /sitemap.xml — every public route worth indexing. Auth-gated routes,
// dashboards, and API endpoints are excluded here and also disallowed in
// robots.ts.

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech').replace(/\/$/, '');
  const now = new Date();

  const make = (path: string, freq: MetadataRoute.Sitemap[number]['changeFrequency'], pri: number) => ({
    url: `${base}${path}`, lastModified: now, changeFrequency: freq, priority: pri,
  });

  return [
    // Top level
    make('/',                            'weekly',  1.0),
    make('/for-creators',                'monthly', 0.9),
    make('/for-workers',                 'monthly', 0.9),
    make('/pricing',                     'monthly', 0.9),

    // Products
    make('/products/insights',           'monthly', 0.95),
    make('/products/abtest',             'monthly', 0.9),
    make('/products/promote',            'monthly', 0.9),
    make('/products/collab',             'monthly', 0.9),

    // Comparisons (high SEO intent)
    make('/compare',                     'monthly', 0.85),
    make('/compare/sub-services',        'monthly', 0.85),

    // Country pages
    make('/ng',                          'monthly', 0.7),
    make('/gh',                          'monthly', 0.7),
    make('/in',                          'monthly', 0.7),
    make('/id',                          'monthly', 0.7),
    make('/my',                          'monthly', 0.7),
    make('/sg',                          'monthly', 0.7),

    // Company
    make('/about',                       'monthly', 0.6),
    make('/contact',                     'monthly', 0.5),
    make('/help',                        'monthly', 0.7),
    make('/blog',                        'weekly',  0.7),

    // Legal / trust
    make('/privacy',                     'yearly',  0.3),
    make('/terms',                       'yearly',  0.3),
    make('/refund-policy',               'yearly',  0.3),
    make('/acceptable-use',              'yearly',  0.4),
    make('/community-guidelines',        'yearly',  0.4),
  ];
}
