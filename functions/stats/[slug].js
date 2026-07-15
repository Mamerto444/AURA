const ACCESS_KEY = 'aura2026';

export async function onRequestGet(context) {
  const { params, request, env } = context;
  const key = new URL(request.url).searchParams.get('key');

  if (key !== ACCESS_KEY) {
    return new Response('Acceso no autorizado', { status: 401 });
  }

  if (!env.ANALYTICS) {
    return new Response('Analytics no configurado aún — agrega el binding ANALYTICS en Cloudflare.', { status: 503 });
  }

  const raw = await env.ANALYTICS.get(`stats:${params.slug}`);
  const stats = raw
    ? JSON.parse(raw)
    : { totalScans: 0, positiveReviews: 0, negativeReviews: 0, lastScan: null, monthly: {} };

  return new Response(renderStats(params.slug, stats), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function renderStats(slug, s) {
  const total = s.positiveReviews + s.negativeReviews;
  const rate = total > 0 ? Math.round((s.positiveReviews / total) * 100) : '—';
  const lastScan = s.lastScan
    ? new Date(s.lastScan).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Sin escaneos aún';

  const monthRows = Object.entries(s.monthly || {})
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([m, d]) => `
      <tr>
        <td>${m}</td>
        <td>${d.scans || 0}</td>
        <td class="green">${d.positive || 0}</td>
        <td class="red">${d.negative || 0}</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AURA Stats — ${slug}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0c; color: #f5f5f7; font-family: system-ui, sans-serif; padding: 28px 16px 48px; max-width: 520px; margin: 0 auto; }
  .header { margin-bottom: 28px; }
  .brand { font-size: 11px; letter-spacing: 3px; color: #C9A84C; margin-bottom: 8px; }
  h1 { font-size: 18px; font-weight: 700; }
  .slug { font-size: 13px; color: #555; margin-top: 2px; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 32px; }
  .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 16px; }
  .val { font-size: 34px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .lbl { font-size: 11px; color: #9a9aa2; text-transform: uppercase; letter-spacing: 0.5px; }
  .gold { color: #C9A84C; }
  .green { color: #4ade80; }
  .red { color: #f87171; }
  h2 { font-size: 11px; letter-spacing: 2px; color: #555; text-transform: uppercase; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { text-align: left; padding: 8px 10px; color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  td { padding: 11px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .last { margin-top: 24px; font-size: 12px; color: #555; }
</style>
</head>
<body>
  <div class="header">
    <p class="brand">AURA</p>
    <h1>Dashboard de métricas</h1>
    <p class="slug">${slug}</p>
  </div>

  <div class="cards">
    <div class="card">
      <div class="val gold">${s.totalScans}</div>
      <div class="lbl">Escaneos totales</div>
    </div>
    <div class="card">
      <div class="val">${rate}${rate !== '—' ? '%' : ''}</div>
      <div class="lbl">Satisfacción</div>
    </div>
    <div class="card">
      <div class="val green">${s.positiveReviews}</div>
      <div class="lbl">Fueron a Google</div>
    </div>
    <div class="card">
      <div class="val red">${s.negativeReviews}</div>
      <div class="lbl">Quejas privadas</div>
    </div>
  </div>

  <h2>Historial mensual</h2>
  ${monthRows
    ? `<table>
        <thead><tr><th>Mes</th><th>Escaneos</th><th>Positivos</th><th>Negativos</th></tr></thead>
        <tbody>${monthRows}</tbody>
       </table>`
    : '<p style="color:#555;font-size:13px;">Sin datos aún.</p>'}

  <p class="last">Último escaneo: ${lastScan}</p>
</body>
</html>`;
}
