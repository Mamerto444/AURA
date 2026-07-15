import { renderHub } from '../_shared/renderHub.js';

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const assetUrl = new URL(`/businesses/${params.slug}.json`, request.url);
  const assetResponse = await env.ASSETS.fetch(assetUrl);
  const isJson = (assetResponse.headers.get('content-type') || '').includes('json');

  if (!assetResponse.ok || !isJson) {
    return new Response('Negocio no encontrado', { status: 404 });
  }

  const business = await assetResponse.json();

  return new Response(renderHub(business), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
