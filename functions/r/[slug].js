import redirects from '../../data/redirects.json';

async function trackScan(env, slug) {
  if (!env.ANALYTICS) return;
  try {
    const key = `stats:${slug}`;
    const raw = await env.ANALYTICS.get(key);
    const stats = raw ? JSON.parse(raw) : { totalScans: 0, positiveReviews: 0, negativeReviews: 0, lastScan: null, monthly: {} };

    stats.totalScans += 1;
    stats.lastScan = new Date().toISOString();

    const month = new Date().toISOString().slice(0, 7);
    if (!stats.monthly[month]) stats.monthly[month] = { scans: 0, positive: 0, negative: 0 };
    stats.monthly[month].scans += 1;

    await env.ANALYTICS.put(key, JSON.stringify(stats));
  } catch (_) {}
}

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const entry = redirects[params.slug];

  if (!entry) {
    return new Response('Enlace no encontrado', { status: 404 });
  }

  context.waitUntil(trackScan(env, params.slug));

  const destination = entry.type === 'hub'
    ? new URL(`/hub/${params.slug}`, request.url).toString()
    : entry.url;

  return Response.redirect(destination, 302);
}
