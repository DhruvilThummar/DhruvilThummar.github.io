import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Engineering Blogs & Architecture Insights | Dhruvil Thummar — Co-founder & CTO',
  description:
    'In-depth technical articles, system architecture breakdowns, and machine learning research by Dhruvil Thummar (D R Thummar), Co-founder & CTO at The Intelliverse. Covering CatBoost, microservices, MERN stack, WebSockets, and CTO leadership.',
  keywords: [
    'Dhruvil Thummar Blog',
    'D R Thummar Articles',
    'CTO Insights',
    'Machine Learning Engineering Blog',
    'CatBoost vs XGBoost Benchmark',
    'Sub-50ms MongoDB Query Optimization',
    'Scaling WebSockets Next.js 16',
    'Exploratory Data Analysis EDA Guide',
    'Multi-Tenant SaaS Architecture',
    'Bayesian Optimization Hyperparameter Tuning',
    'The Intelliverse Engineering',
  ],
  alternates: {
    canonical: 'https://drthummar.me/blog',
  },
  openGraph: {
    title: 'Engineering Blogs & Architecture Insights — Dhruvil Thummar',
    description:
      'Technical writing on Machine Learning, distributed systems, MERN stack architecture, and engineering leadership by Dhruvil Thummar.',
    url: 'https://drthummar.me/blog',
    type: 'website',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
