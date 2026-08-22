'use client';

import { useEffect } from 'react';

export function PWAInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] ServiceWorker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}

export default PWAInitializer;
