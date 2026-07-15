import redirects from '../../data/redirects.json';

export async function onRequestGet(context) {
  const { params, request } = context;
  const entry = redirects[params.slug];

  if (!entry) {
    return new Response('Enlace no encontrado', { status: 404 });
  }

  const destination = entry.type === 'hub'
    ? new URL(`/hub/${params.slug}`, request.url).toString()
    : entry.url;

  return Response.redirect(destination, 302);
}
