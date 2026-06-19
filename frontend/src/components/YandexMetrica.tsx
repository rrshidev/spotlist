'use client';

import { useEffect } from 'react';

const YM_COUNTER_ID = process.env.NEXT_PUBLIC_YM_COUNTER_ID;

export function YandexMetrica() {
  useEffect(() => {
    if (!YM_COUNTER_ID || typeof window === 'undefined') return;

    const id = YM_COUNTER_ID;

    if ((window as any).ym) return;

    (window as any).ym = function (...args: any[]) {
      ((window as any).ym.a = (window as any).ym.a || []).push(args);
    };
    (window as any).ym.l = Date.now();

    const script = document.createElement('script');
    script.src = `https://mc.yandex.ru/metrika/tag.js`;
    script.async = true;
    script.onload = () => {
      (window as any).ym(id, 'init', {
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        webvisor: true,
      });
    };
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  if (!YM_COUNTER_ID) return null;

  return (
    <noscript>
      <div>
        <img
          src={`https://mc.yandex.ru/watch/${YM_COUNTER_ID}`}
          style={{ position: 'absolute', left: '-9999px' }}
          alt=""
        />
      </div>
    </noscript>
  );
}
