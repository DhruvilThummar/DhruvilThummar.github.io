'use client';

import dynamic from 'next/dynamic';

const AbstractHero = dynamic(() => import('@/components/AbstractHero'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-[550px] flex items-center justify-center text-xs font-mono text-slate-400">
      Loading 3D Engine...
    </div>
  ),
});

export function AbstractHeroWrapper() {
  return <AbstractHero />;
}

export default AbstractHeroWrapper;
