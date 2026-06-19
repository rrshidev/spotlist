import { SessionDetailClient } from './SessionDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return {
    title: 'Сессия - SpotList',
    description: 'Встреча на споте для катания',
  };
}

export default function SessionDetailPage() {
  return <SessionDetailClient />;
}
