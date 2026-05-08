import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'SpotList',
  description: 'Находи скейт-споты в своём городе',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}