import { RentalDetailClient } from './RentalDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Прокат - SpotList`,
    description: 'Пункт проката снаряжения',
  };
}

export default function RentalDetailPage() {
  return <RentalDetailClient />;
}
