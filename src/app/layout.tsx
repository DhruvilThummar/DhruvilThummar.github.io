import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { PWAInitializer } from '@/components/PWAInitializer';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#09090B',
};

export const metadata: Metadata = {
  title: 'D R Thummar — Co-founder & CTO at The Intelliverse | Full Stack Architect',
  description:
    'D R Thummar is the Co-founder & CTO at The Intelliverse and Computer Engineering student at L.J. University, Ahmedabad. Expert in Java, Python, TypeScript, React, Next.js, Node.js, WebSockets, and Machine Learning.',
  keywords: [
    'D R Thummar',
    'Dhruvil Thummar',
    'CTO The Intelliverse',
    'Co-founder The Intelliverse',
    'Full Stack Developer Ahmedabad',
    'Systems Architect',
    'Appointory',
    'Script Converter Studio',
    'BUS-IQ Dashboard',
    'Stock Price Predictor',
    'VRIX Jewels',
  ],
  authors: [{ name: 'D R Thummar' }],
  metadataBase: new URL('https://drthummar.me'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/assets/dt-logo-circle.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/assets/dt-logo-circle.svg',
  },
  openGraph: {
    title: 'D R Thummar — Co-founder & CTO at The Intelliverse',
    description:
      'Full Stack Developer & Systems Architect. Building scalable B2B multi-tenant systems, WebSockets microservices, and AI integrations.',
    url: 'https://drthummar.me/',
    siteName: 'D R Thummar Portfolio',
    images: [
      {
        url: '/assets/dt-logo-og.png',
        width: 1200,
        height: 630,
        alt: 'D R Thummar — Co-founder & CTO at The Intelliverse',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'D R Thummar — Co-founder & CTO at The Intelliverse',
    description:
      'Full Stack Developer & Systems Architect. Builder of Appointory, Script Converter Studio, BUS-IQ Dashboard.',
    images: ['/assets/dt-logo-og.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      style={{ colorScheme: 'light' }}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/assets/dt-logo-circle.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/assets/dt-logo-circle.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#09090B" />
        {/* Connected JSON-LD Schema org */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://drthummar.me/#website',
                  url: 'https://drthummar.me/',
                  name: 'D R Thummar — Co-founder & CTO at The Intelliverse',
                  image: 'https://drthummar.me/assets/dt-logo-og.png',
                },
                {
                  '@type': 'Person',
                  '@id': 'https://drthummar.me/#person',
                  name: 'D R Thummar',
                  alternateName: ['Dhruvil Thummar', 'Dhruvil R. Thummar'],
                  jobTitle: 'Co-founder & CTO',
                  image: 'https://drthummar.me/assets/dt-logo-og.png',
                  logo: 'https://drthummar.me/assets/dt-logo-circle.svg',
                  url: 'https://drthummar.me/',
                  sameAs: [
                    'https://github.com/DhruvilThummar',
                    'https://www.linkedin.com/in/dhruvil-thummar-54422731a',
                  ],
                  worksFor: {
                    '@type': 'Organization',
                    name: 'The Intelliverse',
                    logo: 'https://drthummar.me/assets/dt-logo-circle.svg',
                  },
                  alumniOf: {
                    '@type': 'CollegeOrUniversity',
                    name: 'L.J. University',
                  },
                  knowsAbout: [
                    'Java',
                    'Python',
                    'TypeScript',
                    'React',
                    'Next.js',
                    'WebSockets',
                    'Machine Learning',
                    'System Architecture',
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-[#FCFCFC] text-[#09090B] antialiased selection:bg-[#09090B] selection:text-white">
        <PWAInitializer />
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}


