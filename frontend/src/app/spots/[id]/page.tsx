import { Metadata } from 'next';
import SpotPageClient from './SpotPageClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getSpot(id: string) {
  try {
    const res = await fetch(`${API_URL}/spots/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const spot = await getSpot(id);
  if (!spot) {
    return { title: 'Spot not found - SpotList' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlist.online';
  const spotUrl = `${siteUrl}/spots/${id}`;
  const description = spot.description
    ? spot.description.replace(/<[^>]+>/g, '').slice(0, 200)
    : `Спот для катания в ${spot.city || 'городе'}`;
  let imageUrl = spot.media?.[0]
    ? (spot.media[0].startsWith('http') ? spot.media[0] : `${siteUrl}${spot.media[0]}`)
    : spot.screenshot
    ? (spot.screenshot.startsWith('http') ? spot.screenshot : `${siteUrl}${spot.screenshot}`)
    : '';

  const ext = imageUrl.split('.').pop()?.toLowerCase();
  const telegramSupported = ext && ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext);
  if (!telegramSupported) {
    imageUrl = '';
  }

  return {
    title: `${spot.name} - SpotList`,
    description,
    openGraph: {
      title: `${spot.name} - SpotList`,
      description,
      url: spotUrl,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${spot.name} - SpotList`,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <SpotPageClient key={id} />;
}
