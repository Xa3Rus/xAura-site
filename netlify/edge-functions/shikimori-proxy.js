export default async (request, context) => {
  const url = new URL(request.url);
  const targetPath = url.pathname.replace('/shikimori-img', '');
  const targetUrl = `https://shikimori.io${targetPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://shikimori.io/',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return new Response('Not found', { status: response.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=604800');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    return new Response('Proxy error', { status: 502 });
  }
};

export const config = { path: '/shikimori-img/*' };
