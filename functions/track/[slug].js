async function trackReview(env, slug, type) {
  if (!env.ANALYTICS) return;
  try {
    const key = `stats:${slug}`;
    const raw = await env.ANALYTICS.get(key);
    const stats = raw ? JSON.parse(raw) : { totalScans: 0, positiveReviews: 0, negativeReviews: 0, lastScan: null, monthly: {} };

    const month = new Date().toISOString().slice(0, 7);
    if (!stats.monthly[month]) stats.monthly[month] = { scans: 0, positive: 0, negative: 0 };

    if (type === 'positive') {
      stats.positiveReviews += 1;
      stats.monthly[month].positive += 1;
    } else {
      stats.negativeReviews += 1;
      stats.monthly[month].negative += 1;
    }

    await env.ANALYTICS.put(key, JSON.stringify(stats));
  } catch (_) {}
}

export async function onRequest(context) {
  const { params, request, env } = context;
  const type = new URL(request.url).searchParams.get('type');

  if (type === 'positive' || type === 'negative') {
    context.waitUntil(trackReview(env, params.slug, type));
  }

  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain',
    },
  });
}
