import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_UA = /bot|telegram|twitter|facebook|slack|discord|whatsapp|pinterest|linkedin|viber|pocket|flipboard|tumblr|reddit|skype|embedly|google.*snippet|slack.*link/i;

export const config = {
  matcher: '/spots/:id',
};

export async function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) {
    return NextResponse.next();
  }

  const id = req.nextUrl.pathname.split('/').pop();
  if (!id) return NextResponse.next();

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${apiUrl}/spots/${id}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return NextResponse.next();
    const spot = await res.json();

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spotlist.online';
    const spotUrl = `${siteUrl}/spots/${id}`;
    const description = spot.description
      ? spot.description.replace(/<[^>]+>/g, '').slice(0, 300)
      : `Спот для катания в ${spot.city || 'городе'}`;

    const imageUrl = spot.media?.[0]
      ? (spot.media[0].startsWith('http') ? spot.media[0] : `${siteUrl}${spot.media[0]}`)
      : spot.screenshot
      ? (spot.screenshot.startsWith('http') ? spot.screenshot : `${siteUrl}${spot.screenshot}`)
      : '';

    const ext = imageUrl.split('.').pop()?.toLowerCase();
    const hasImage = ext && ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext);

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(spot.name)} - SpotList</title>
  <meta name="description" content="${escapeHtml(description)}"/>
  <meta property="og:title" content="${escapeHtml(spot.name)} - SpotList"/>
  <meta property="og:description" content="${escapeHtml(description)}"/>
  <meta property="og:url" content="${escapeHtml(spotUrl)}"/>
  <meta property="og:type" content="website"/>
  ${hasImage ? `<meta property="og:image" content="${escapeHtml(imageUrl)}"/>` : ''}
  ${hasImage ? '<meta property="og:image:width" content="1200"/>' : ''}
  ${hasImage ? '<meta property="og:image:height" content="630"/>' : ''}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${escapeHtml(spot.name)} - SpotList"/>
  <meta name="twitter:description" content="${escapeHtml(description)}"/>
  ${hasImage ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"/>` : ''}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(spotUrl)}"/>
</head>
<body>
  <h1>${escapeHtml(spot.name)}</h1>
  <p>${escapeHtml(description)}</p>
  <p><a href="${escapeHtml(spotUrl)}">Перейти на SpotList</a></p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch {
    return NextResponse.next();
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
