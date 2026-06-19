import './globals.css';
import { Providers } from './providers';

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
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}