'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    ym: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const YM_ID = Number(process.env.NEXT_PUBLIC_YM_COUNTER_ID) || 0;

export function YandexMetricaClient() {
  const pathname = usePathname();

  useEffect(() => {
    if (!YM_ID || typeof window === 'undefined') return;

    if (typeof window.ym !== 'function') {
      window.ym = function (...args) {
        ((window.ym as any).a = (window.ym as any).a || []).push(args);
      };
      window.ym.l = Date.now();

      const script = document.createElement('script');
      script.src = 'https://mc.yandex.ru/metrika/tag.js';
      script.async = true;
      document.head.appendChild(script);

      window.ym(YM_ID, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      });
    }

    window.ym(YM_ID, 'hit', window.location.href);
  }, [YM_ID]);

  useEffect(() => {
    if (!YM_ID || typeof window.ym !== 'function') return;
    window.ym(YM_ID, 'hit', window.location.href);
  }, [pathname]);

  return null;
}
