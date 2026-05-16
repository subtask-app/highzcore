// Full marketing footer — link columns + country chips + an ambient
// gradient backdrop that lines up with the 3D system used on hero +
// section areas.

import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { AmbientBackdrop } from '@/components/marketing3d/AmbientBackdrop';

interface Column {
  title: string;
  links: { href: string; label: string }[];
}

const COLUMNS: Column[] = [
  {
    title: 'Products',
    links: [
      { href: '/products/insights', label: 'Audience Insights' },
      { href: '/products/abtest',   label: 'Thumbnail & Title Testing' },
      { href: '/products/promote',  label: 'Promote' },
      { href: '/products/collab',   label: 'Collab' },
      { href: '/pricing',           label: 'Pricing' },
      { href: '/compare',           label: 'Compare' },
    ],
  },
  {
    title: 'For you',
    links: [
      { href: '/for-creators', label: 'For creators' },
      { href: '/for-workers',  label: 'For workers' },
      { href: '/signup',       label: 'Sign up' },
      { href: '/login',        label: 'Log in' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/help',                      label: 'Help center' },
      { href: '/blog',                      label: 'Blog' },
      { href: '/compare/sub-services',      label: 'vs sub services' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about',   label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal & trust',
    links: [
      { href: '/terms',                       label: 'Terms of Service' },
      { href: '/privacy',                     label: 'Privacy Policy' },
      { href: '/refund-policy',               label: 'Refund Policy' },
      { href: '/acceptable-use',              label: 'Acceptable Use' },
      { href: '/community-guidelines',        label: 'Community Guidelines' },
    ],
  },
];

const COUNTRY_LINKS: { href: string; label: string }[] = [
  { href: '/ng', label: 'Nigeria' },
  { href: '/gh', label: 'Ghana' },
  { href: '/in', label: 'India' },
  { href: '/id', label: 'Indonesia' },
  { href: '/my', label: 'Malaysia' },
  { href: '/sg', label: 'Singapore' },
];

export function MarketingFooter() {
  return (
    <footer className="relative isolate border-t border-border bg-bg-elevated overflow-hidden">
      <AmbientBackdrop variant="subtle" />
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-3">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="inline-block text-sm text-fg-muted hover:text-fg transition-colors relative
                                 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-brand
                                 after:scale-x-0 after:origin-left hover:after:scale-x-100
                                 after:transition-transform after:duration-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-fg-subtle mb-3">Countries we serve</p>
          <div className="flex flex-wrap gap-3">
            {COUNTRY_LINKS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="inline-flex items-center h-8 px-3 rounded-full border border-border bg-surface/60 backdrop-blur text-sm font-medium text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Logo size="sm" href={null} />
            <span className="text-sm text-fg-muted">
              Real audiences. Honest data. Real growth.
            </span>
          </div>
          <p className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} Highzcore. Built for creators worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
