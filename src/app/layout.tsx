import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TelegramAutoLink from "@/components/telegram/TelegramAutoLink";
import TelegramBridge from "@/components/telegram/TelegramBridge";
import JsonLd from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/components/seo/structured-data";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

// Inter is loaded as a variable font with all weights + optical sizing.
// We use the same family for both body and display; the display utility
// class in globals.css turns on the proper feature settings.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  axes: ['opsz'],
});

// Mono used for tabular numerics, IDs, and crypto addresses in dashboards.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://highzcore.tech';
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? 'Highzcore';
const DESCRIPTION =
  'The fastest legitimate way to reach 1,000 YouTube subscribers. Real people, real subscriptions — every one verified by YouTube\'s Data API. Pay once, no bots, no risk to monetization.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Grow your YouTube channel with real subscribers`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  generator: 'Next.js',
  keywords: [
    'YouTube growth',
    'YouTube subscribers',
    'buy YouTube subscribers',
    'real YouTube subscribers',
    'YouTube monetization',
    '1000 YouTube subscribers',
    'YouTube Partner Program',
    'grow YouTube channel',
    'earn money online',
    'YouTube subscription tasks',
    'side income Telegram',
    'Telegram mini app',
    'Highzcore',
  ],
  category: 'business',
  classification: 'YouTube growth marketplace',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: `${SITE_NAME} — Grow your YouTube channel with real subscribers`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — real YouTube subscribers, verified by the YouTube API`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Grow your YouTube channel with real subscribers`,
    description: DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@Highzcore',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: { 'en-US': SITE_URL },
  },
  verification: {
    // Add your Google Search Console verification token once you've set
    // up the property at https://search.google.com/search-console.
    // google: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)',  color: '#020617' },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Telegram WebApp ignores most viewport flags; web users still benefit.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        {/* Telegram Web App SDK — no-op outside the Telegram client. */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" />
        <ThemeProvider>
          {/* Reads window.Telegram.WebApp.initData when present, links the user, redirects. */}
          <TelegramAutoLink />
          {/* tg.ready() + tg.expand() + theme sync; marks <html data-in-telegram>. */}
          <TelegramBridge />
          {/* Organization + WebSite structured data — helps Google build a rich
              knowledge-graph card for the brand. Renders inline JSON-LD. */}
          <JsonLd data={organizationSchema(SITE_URL, SITE_NAME)} />
          <JsonLd data={websiteSchema(SITE_URL, SITE_NAME)} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
