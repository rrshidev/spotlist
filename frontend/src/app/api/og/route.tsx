import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'SpotList';
  const imageParam = searchParams.get('image');

  let imgSrc: string | undefined;

  if (imageParam) {
    try {
      const imgUrl = imageParam.startsWith('http') ? imageParam : `https://spotlist.online${imageParam}`;
      const resp = await fetch(imgUrl, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        const blob = await resp.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mime = blob.type === 'image/webp' ? 'image/jpeg' : blob.type;
        imgSrc = `data:${mime};base64,${base64}`;
      }
    } catch {
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          fontFamily: 'system-ui',
        }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px',
            }}
          >
            <h1
              style={{
                color: '#39ff14',
                fontSize: 60,
                margin: 0,
                textAlign: 'center',
              }}
            >
              {title.length > 100 ? title.slice(0, 100) + '...' : title}
            </h1>
            <p
              style={{
                color: '#ffffff',
                fontSize: 30,
                marginTop: 20,
                opacity: 0.8,
              }}
            >
              SpotList
            </p>
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
