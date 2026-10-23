import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { PWAInitializer } from '@/components/PWAInitializer';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: false,
});

export const viewport: Viewport = {
  themeColor: '#09090B',
};

export const metadata: Metadata = {
  title: {
    default:
      'Dhruvil Thummar (D R Thummar) — Co-founder & CTO at The Intelliverse | Machine Learning Engineer, Data Scientist & MERN Stack Developer',
    template: '%s | Dhruvil Thummar',
  },
  description:
    'Official portfolio of Dhruvil Thummar (D R Thummar), Co-founder & Chief Technology Officer (CTO) at The Intelliverse. High-impact Machine Learning Engineer, Data Scientist, and MERN Stack Software Developer specializing in predictive AI modeling, scalable 3-tier enterprise microservices, real-time WebSockets, and sub-50ms database architecture.',
  keywords: [
    // Primary Name Variations
    'Dhruvil Thummar',
    'D R Thummar',
    'Dhruvil R Thummar',
    'DR Thummar',
    'Dhruvil Thummar Portfolio',
    'Dhruvil Thummar GitHub',
    'Dhruvil Thummar LinkedIn',
    // Executive Leadership & Founder Titles
    'CTO The Intelliverse',
    'Co-founder The Intelliverse',
    'Co-founder & CTO at The Intelliverse',
    'Chief Technology Officer',
    'The Intelliverse CTO',
    'Founder & Technical Leader',
    // Targeted Engineering & Developer Roles
    'MERN Stack Developer',
    'MERN dev',
    'MERN Developer',
    'Machine Learning Engineer',
    'ML Engineer',
    'Data Scientist',
    'Data Science Specialist',
    'Data Analyst',
    'Software Engineer',
    'Software Developer',
    'Full Stack Developer',
    'Systems Architect',
    'AI Engineer',
    'Web Developer Ahmedabad',
    'Software Engineer Gujarat India',
    // Technical Specializations & Stack
    'IBM Certified Data Scientist',
    'Python for Data Science',
    'Scikit-Learn',
    'CatBoost',
    'Exploratory Data Analysis EDA',
    'Next.js 16 Developer',
    'React 19 Developer',
    'Node.js Express MongoDB',
    'TypeScript Developer',
    'WebSockets Real-Time Engineer',
    'Three.js WebGL Developer',
    // Key Projects & Academic
    'Appointory',
    'Script Converter Studio',
    'BUS-IQ Dashboard',
    'Stock Price Predictor',
    'VRIX Jewels',
    'L.J. University Computer Engineering',
  ],
  authors: [{ name: 'Dhruvil Thummar (D R Thummar)', url: 'https://drthummar.me' }],
  creator: 'Dhruvil Thummar',
  publisher: 'The Intelliverse',
  category: 'Technology & Software Engineering',
  classification: 'Portfolio / Software Engineering / Artificial Intelligence',
  metadataBase: new URL('https://drthummar.me'),
  alternates: {
    canonical: 'https://drthummar.me',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
    title:
      'Dhruvil Thummar (D R Thummar) — Co-founder & CTO at The Intelliverse | Machine Learning & MERN Architect',
    description:
      'Official engineering portfolio of Dhruvil Thummar: Co-founder & CTO at The Intelliverse, Machine Learning Engineer, Data Scientist, and MERN Stack Developer.',
    url: 'https://drthummar.me/',
    siteName: 'Dhruvil Thummar Portfolio',
    images: [
      {
        url: '/assets/dt-logo-og.png',
        width: 1200,
        height: 630,
        alt: 'Dhruvil Thummar — Co-founder & CTO at The Intelliverse | Machine Learning & MERN Stack Architect',
      },
    ],
    locale: 'en_US',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title:
      'Dhruvil Thummar (D R Thummar) — Co-founder & CTO | ML Engineer & MERN Developer',
    description:
      'Co-founder & CTO at The Intelliverse. Machine Learning Engineer, Data Scientist, and MERN Stack Developer.',
    images: ['/assets/dt-logo-og.png'],
    creator: '@DhruvilThummar',
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
        {/* Connected Google Knowledge Graph JSON-LD Schema */}
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
                  name: 'Dhruvil Thummar — Official Engineering Portfolio',
                  alternateName: [
                    'D R Thummar Portfolio',
                    'Dhruvil Thummar CTO The Intelliverse',
                    'Dhruvil Thummar MERN Dev & ML Engineer',
                  ],
                  publisher: { '@id': 'https://drthummar.me/#person' },
                  inLanguage: 'en-US',
                },
                {
                  '@type': 'ProfilePage',
                  '@id': 'https://drthummar.me/#profilepage',
                  url: 'https://drthummar.me/',
                  name: 'Dhruvil Thummar Profile — Co-founder & CTO at The Intelliverse',
                  isPartOf: { '@id': 'https://drthummar.me/#website' },
                  mainEntity: { '@id': 'https://drthummar.me/#person' },
                },
                {
                  '@type': 'Person',
                  '@id': 'https://drthummar.me/#person',
                  name: 'Dhruvil Thummar',
                  givenName: 'Dhruvil',
                  familyName: 'Thummar',
                  additionalName: 'R',
                  alternateName: [
                    'D R Thummar',
                    'Dhruvil R. Thummar',
                    'DR Thummar',
                    'DhruvilThummar',
                  ],
                  jobTitle: 'Co-founder & Chief Technology Officer (CTO)',
                  description:
                    'Co-founder & Chief Technology Officer at The Intelliverse, Machine Learning Engineer, Data Scientist, and MERN Stack Software Developer based in Ahmedabad, Gujarat, India.',
                  gender: 'Male',
                  image: 'https://drthummar.me/assets/dt-logo-og.png',
                  logo: 'https://drthummar.me/assets/dt-logo-circle.svg',
                  url: 'https://drthummar.me/',
                  email: 'mailto:dhruvilthummar1303@gmail.com',
                  telephone: '+91-9265809361',
                  sameAs: [
                    'https://github.com/DhruvilThummar',
                    'https://www.linkedin.com/in/dhruvil-thummar-54422731a',
                    'https://drthummar.me/',
                  ],
                  worksFor: {
                    '@type': 'Organization',
                    '@id': 'https://theintelliverse.com/#organization',
                    name: 'The Intelliverse',
                    url: 'https://drthummar.me/',
                    logo: 'https://drthummar.me/assets/dt-logo-circle.svg',
                  },
                  hasOccupation: [
                    {
                      '@type': 'Occupation',
                      name: 'Chief Technology Officer (CTO)',
                      occupationLocation: {
                        '@type': 'City',
                        name: 'Ahmedabad, Gujarat, India',
                      },
                      skills:
                        'Technology Vision, Scalable 3-Tier Architecture, Microservices, Team Leadership, Cloud Infrastructure',
                    },
                    {
                      '@type': 'Occupation',
                      name: 'Machine Learning Engineer',
                      skills:
                        'Scikit-Learn, CatBoost, Predictive Modeling Pipelines, Feature Engineering, Python for Data Science',
                    },
                    {
                      '@type': 'Occupation',
                      name: 'Data Scientist',
                      skills:
                        'Exploratory Data Analysis (EDA), Statistical Inference, Pandas, NumPy, Business Data Analytics',
                    },
                    {
                      '@type': 'Occupation',
                      name: 'MERN Stack Developer',
                      skills:
                        'MongoDB, Express.js, React 19, Next.js 16, Node.js, WebSockets, TypeScript, REST APIs',
                    },
                    {
                      '@type': 'Occupation',
                      name: 'Software Engineer',
                      skills:
                        'Full Stack Software Engineering, Real-Time WebSockets Engine, Database Query Optimization',
                    },
                  ],
                  alumniOf: {
                    '@type': 'CollegeOrUniversity',
                    name: 'L.J. University',
                    location: {
                      '@type': 'Place',
                      address: {
                        '@type': 'PostalAddress',
                        addressLocality: 'Ahmedabad',
                        addressRegion: 'Gujarat',
                        addressCountry: 'India',
                      },
                    },
                  },
                  hasCredential: [
                    {
                      '@type': 'EducationalOccupationalCredential',
                      name: 'Python for Data Science',
                      credentialCategory: 'Professional Certification',
                      recognizedBy: {
                        '@type': 'Organization',
                        name: 'IBM',
                      },
                    },
                    {
                      '@type': 'EducationalOccupationalCredential',
                      name: 'Exploratory Data Analysis for Machine Learning',
                      credentialCategory: 'Professional Certification',
                      recognizedBy: {
                        '@type': 'Organization',
                        name: 'IBM',
                      },
                    },
                  ],
                  knowsAbout: [
                    'Machine Learning',
                    'Data Science',
                    'Data Analytics',
                    'MERN Stack',
                    'Full Stack Development',
                    'Software Engineering',
                    'Python',
                    'Scikit-Learn',
                    'CatBoost',
                    'Pandas',
                    'NumPy',
                    'React',
                    'Next.js',
                    'TypeScript',
                    'JavaScript',
                    'Node.js',
                    'Express.js',
                    'MongoDB',
                    'WebSockets',
                    'Socket.io',
                    'Three.js',
                    'WebGL',
                    'System Architecture',
                    'CTO Leadership',
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="bg-[#FCFCFC] text-[#09090B] antialiased selection:bg-[#09090B] selection:text-white overflow-x-hidden">
        {/* Google Analytics Tag (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-VD4K7YG2KP"
        />
        <Script
          id="google-analytics-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VD4K7YG2KP', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />

        <SmoothScrollProvider>
          <PWAInitializer />
          <CommandPalette />
          {children}
          <Analytics />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}


