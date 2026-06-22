import './globals.css';
import { Providers } from './providers';
import { Footer } from '@/components/Footer';

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
      <body>
        <script dangerouslySetInnerHTML={{
          __html: `window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();window.__pwaPrompt=e;});`
        }} />
        <Providers>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </Providers>
        {ymId ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js','ym');

ym(${ymId}, 'init', {
  clickmap:true,
  trackLinks:true,
  accurateTrackBounce:true,
  webvisor:true
});

window.addEventListener('load', function() {
  setTimeout(function() {
    ym(${ymId}, 'hit', location.href);
  }, 500);
});
                `.trim(),
              }}
            />
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${ymId}`}
                  style={{ position: 'absolute', left: '-9999px' }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        ) : null}
      </body>
    </html>
  );
}