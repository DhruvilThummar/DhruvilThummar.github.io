import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Projects Archive | Dhruvil Thummar — Co-founder & CTO at The Intelliverse',
  description:
    'Explore production systems engineered by Dhruvil Thummar (D R Thummar): Machine Learning predictive models, enterprise MERN stack platforms, real-time WebSockets engines, and 3-tier microservices including Appointory, Script Converter Studio, and BUS-IQ.',
  keywords: [
    'Dhruvil Thummar Projects',
    'D R Thummar Projects',
    'MERN Stack Projects',
    'Machine Learning Projects',
    'Data Science Projects',
    'Appointory Multi-Tenant SaaS',
    'Script Converter Studio',
    'BUS-IQ Dashboard',
    'Stock Price Predictor Machine Learning',
    'VRIX Jewels E-Commerce',
    'Next.js 16 React 19 Projects',
    'WebSockets Real-Time Architecture',
  ],
  alternates: {
    canonical: 'https://drthummar.me/projects',
  },
  openGraph: {
    title: 'Engineering Projects Archive — Dhruvil Thummar',
    description:
      'Production systems, Machine Learning pipelines, and MERN stack architectures built by Dhruvil Thummar (Co-founder & CTO at The Intelliverse).',
    url: 'https://drthummar.me/projects',
    type: 'website',
  },
};

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
