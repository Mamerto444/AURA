import { icons } from './icons.js';

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function toScriptSafeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function renderReview(business, slug) {
  const accent = business.accentColor || '#6C5CE7';
  const starIcon = icons.star;
  const ownerPhone = (business.ownerWhatsapp || '').replace(/[^\d]/g, '');
  const rawGoogleUrl = business.googleReviewUrl || '';
  const googleUrl = rawGoogleUrl.includes('PLACE_ID') ? '' : rawGoogleUrl;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>Tu opinión — ${escapeHtml(business.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-deep: #0a0a0c;
    --bg-elevated: rgba(255,255,255,0.06);
    --bg-elevated-hover: rgba(255,255,255,0.1);
    --border: rgba(255,255,255,0.09);
    --text-primary: #f5f5f7;
    --text-muted: #9a9aa2;
    --accent: ${accent};
    --radius: 16px;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    background: var(--bg-deep);
    color: var(--text-primary);
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    display: flex;
    justify-content: center;
    padding: 40px 20px 48px;
  }
  main { width: 100%; max-width: 420px; text-align: center; }
  h1 { font-size: 19px; font-weight: 700; margin: 0 0 28px; line-height: 1.4; }
  .stars { display: flex; justify-content: center; gap: 6px; margin-bottom: 8px; }
  .star-btn {
    background: none; border: none; padding: 6px; cursor: pointer;
    color: var(--text-muted);
    transition: transform 150ms ease, color 150ms ease;
  }
  .star-btn svg { width: 36px; height: 36px; fill: none; stroke: currentColor; stroke-width: 1.6; }
  .star-btn.active { color: var(--accent); }
  .star-btn.active svg { fill: currentColor; }
  .star-btn:hover { transform: scale(1.08); }
  .star-btn:active { transform: scale(0.96); }
  .star-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 8px; }
  .star-btn:disabled { cursor: default; }
  .branch { margin-top: 28px; }
  .branch[hidden] { display: none; }
  .branch p { color: var(--text-muted); font-size: 14px; line-height: 1.6; margin: 0 0 18px; }
  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%; min-height: 48px; padding: 12px 20px;
    border-radius: var(--radius); background: var(--accent); color: #fff;
    font-weight: 600; font-size: 15px; text-decoration: none;
    border: none; transition: filter 150ms ease, transform 150ms ease;
  }
  .btn:hover { filter: brightness(1.08); }
  .btn:active { transform: scale(0.98); }
  .btn:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
  .secondary-link {
    display: inline-block; margin-top: 16px; font-size: 13px;
    color: var(--text-muted); text-decoration: underline; text-underline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .star-btn, .btn { transition: none; }
  }
</style>
</head>
<body>
<main>
  <h1>¿Cómo estuvo tu experiencia en ${escapeHtml(business.name)}?</h1>

  <div class="stars" id="stars" role="group" aria-label="Calificación de 1 a 5 estrellas">
    ${[1, 2, 3, 4, 5].map((value) => `
    <button type="button" class="star-btn" data-value="${value}" aria-label="${value} estrella${value > 1 ? 's' : ''}">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">${starIcon}</svg>
    </button>`).join('')}
  </div>

  <div class="branch" id="positive-branch" hidden>
    ${googleUrl
      ? `<p>¡Qué gusto! Te llevamos a dejar tu reseña en Google…</p>
    <a class="btn" id="google-link" href="${escapeHtml(googleUrl)}">Ir a Google ahora</a>`
      : `<p>¡Qué gusto! Gracias por contarnos cómo te fue.</p>`}
  </div>

  <div class="branch" id="negative-branch" hidden>
    <p>Gracias por avisarnos. ¿Nos cuentas qué pasó para poder mejorarlo directamente contigo?</p>
    <a class="btn" id="whatsapp-link" href="#" target="_blank" rel="noopener">Escribirle al negocio</a>
    ${googleUrl
      ? `<a class="secondary-link" id="google-anyway-link" href="${escapeHtml(googleUrl)}">Prefiero dejar mi reseña en Google de todas formas</a>`
      : ''}
  </div>
</main>
<script>
(function () {
  var GOOGLE_URL = ${toScriptSafeJson(googleUrl)};
  var OWNER_PHONE = ${toScriptSafeJson(ownerPhone)};
  var BUSINESS_NAME = ${toScriptSafeJson(business.name)};

  var stars = Array.prototype.slice.call(document.querySelectorAll('.star-btn'));
  var positive = document.getElementById('positive-branch');
  var negative = document.getElementById('negative-branch');
  var googleLink = document.getElementById('google-link');
  var whatsappLink = document.getElementById('whatsapp-link');
  var googleAnywayLink = document.getElementById('google-anyway-link');

  stars.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = Number(btn.dataset.value);
      stars.forEach(function (b, i) {
        b.classList.toggle('active', i < value);
        b.disabled = true;
      });

      if (value >= 4) {
        negative.hidden = true;
        positive.hidden = false;
        if (GOOGLE_URL) {
          googleLink.href = GOOGLE_URL;
          setTimeout(function () { window.location.href = GOOGLE_URL; }, 900);
        }
      } else {
        positive.hidden = true;
        negative.hidden = false;
        var message = 'Hola, tuve una experiencia de ' + value + ' estrella(s) en ' + BUSINESS_NAME + ' y quisiera platicarlo.';
        if (OWNER_PHONE) {
          whatsappLink.href = 'https://wa.me/' + OWNER_PHONE + '?text=' + encodeURIComponent(message);
        }
        if (GOOGLE_URL) {
          googleAnywayLink.href = GOOGLE_URL;
        }
      }
    });
  });
})();
</script>
</body>
</html>`;
}
