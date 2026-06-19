import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlist.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/wishlist`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    { url: `${SITE_URL}/spots/new`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  try {
    const res = await fetch(`${API_URL}/spots?page=1&page_size=1000`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const spots = data.spots || data || [];
      const spotPages: MetadataRoute.Sitemap = spots.map((spot: { id: string; created_at?: string }) => ({
        url: `${SITE_URL}/spots/${spot.id}`,
        lastModified: spot.created_at ? new Date(spot.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
      return [...staticPages, ...spotPages];
    }
  } catch {
    // fallback to static pages only
  }

  return staticPages;
}
