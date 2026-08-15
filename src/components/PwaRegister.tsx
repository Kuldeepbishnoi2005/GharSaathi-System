'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('GharSaathi PWA Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  return null;
}
