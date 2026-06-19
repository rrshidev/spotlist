import { SessionsPageClient } from './SessionsPageClient';

export const metadata = {
  title: 'Сессии и джемы - SpotList',
  description: 'Встречи и джемы на спотах для катания',
};

export default function SessionsPage() {
  return <SessionsPageClient />;
}
