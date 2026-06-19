import './globals.css';
import { Providers } from './providers';
import { YandexMetricaClient } from '@/components/YandexMetricaClient';

export const metadata = {
  title: 'SpotList',
  description: 'Find skate spots in your city — Находи скейт-споты в своём городе',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }, { url: '/icon-192x192.png', sizes: '192x192' }, { url: '/icon-512x512.png', sizes: '512x512' }],
    apple: '/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ymId = process.env.NEXT_PUBLIC_YM_COUNTER_ID;

  return (
    <html lang="en">
      <head>
        {ymId ? (
          <noscript>
            <div>
              <img
                src={`https://mc.yandex.ru/watch/${ymId}`}
                style={{ position: 'absolute', left: '-9999px' }}
                alt=""
              />
            </div>
          </noscript>
        ) : null}
      </head>
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();window.__pwaPrompt=e;});`
        }} />
        <Providers>{children}</Providers>
        {ymId ? <YandexMetricaClient /> : null}
      </body>
    </html>
  );
}