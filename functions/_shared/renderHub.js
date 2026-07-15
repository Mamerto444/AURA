import { icons } from './icons.js';

const SOCIAL_ICON_BY_KEY = {
  instagram: 'instagram',
  tiktok: 'music',
  whatsapp: 'chat',
  facebook: 'facebook',
  web: 'globe',
};

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderIcon(name) {
  const path = icons[name] || icons.link;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function renderButton(btn) {
  const highlightClass = btn.highlight ? ' btn-highlight' : '';
  const highlightStyle = btn.highlight ? ` style="background:var(--accent);"` : '';
  return `
      <a class="btn${highlightClass}" href="${escapeHtml(btn.url)}"${highlightStyle}>
        <span class="btn-icon" aria-hidden="true">${renderIcon(btn.icon)}</span>
        <span class="btn-text">
          <span class="btn-label">${escapeHtml(btn.label)}</span>
          ${btn.subtitle ? `<span class="btn-subtitle">${escapeHtml(btn.subtitle)}</span>` : ''}
        </span>
      </a>`;
}

function renderSocial(key, url) {
  const iconName = SOCIAL_ICON_BY_KEY[key] || 'link';
  return `<a class="social" href="${escapeHtml(url)}" aria-label="${escapeHtml(key)}">${renderIcon(iconName)}</a>`;
}

function renderHero(business) {
  const socialsHtml = Object.entries(business.socials || {})
    .map(([key, url]) => renderSocial(key, url)).join('\n');

  if (business.heroImage) {
    // Banner full-width con foto de fondo, overlay y datos del negocio encima
    return `
  <div class="hero" style="--hero-img:url('${escapeHtml(business.heroImage)}')">
    <div class="hero-overlay">
      ${business.logo ? `<img class="hero-logo" src="${escapeHtml(business.logo)}" alt="${escapeHtml(business.name)}">` : ''}
      <h1 class="hero-name">${escapeHtml(business.name)}</h1>
      ${business.tagline ? `<p class="hero-tagline">${escapeHtml(business.tagline)}</p>` : ''}
      ${socialsHtml ? `<div class="socials hero-socials">${socialsHtml}</div>` : ''}
    </div>
  </div>`;
  }

  if (business.heroGradient) {
    // Banner de color de marca (sin foto) con el logo en grande al centro
    return `
  <div class="hero-gradient">
    ${business.logo ? `<img class="hero-gradient-logo" src="${escapeHtml(business.logo)}" alt="${escapeHtml(business.name)}">` : ''}
    <h1 class="hero-name">${escapeHtml(business.name)}</h1>
    ${business.tagline ? `<p class="hero-tagline">${escapeHtml(business.tagline)}</p>` : ''}
    ${socialsHtml ? `<div class="socials hero-socials">${socialsHtml}</div>` : ''}
  </div>`;
  }

  // Sin hero: perfil clásico con avatar circular
  return `
  <div class="profile">
    ${business.logo ? `<img class="avatar" src="${escapeHtml(business.logo)}" alt="${escapeHtml(business.name)}">` : ''}
    <h1>${escapeHtml(business.name)}</h1>
    ${business.tagline ? `<p class="tagline">${escapeHtml(business.tagline)}</p>` : ''}
    ${socialsHtml ? `<div class="socials">${socialsHtml}</div>` : ''}
  </div>`;
}

function renderGallery(images) {
  if (!images || images.length === 0) return '';
  const items = images.map(src =>
    `<div class="gallery-item"><img src="${escapeHtml(src)}" alt="" loading="lazy"></div>`
  ).join('\n');
  return `<div class="gallery">${items}</div>`;
}

export function renderHub(business) {
  const accent = business.accentColor || '#6C5CE7';
  const hasHero = !!(business.heroImage || business.heroGradient);
  const buttonsHtml = (business.buttons || []).map(renderButton).join('\n');
  const galleryHtml = renderGallery(business.gallery);
  const heroHtml = renderHero(business);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>${escapeHtml(business.name)}</title>
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
    ${hasHero ? 'padding: 0 0 48px;' : 'padding: 32px 16px 48px;'}
  }
  main { width: 100%; max-width: 480px; }

  /* ── HERO (con imagen) ── */
  .hero {
    width: 100%;
    height: 260px;
    background-image: var(--hero-img);
    background-size: cover;
    background-position: center;
    position: relative;
    border-radius: 0 0 24px 24px;
    overflow: hidden;
    margin-bottom: 20px;
  }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: flex-end;
    padding: 20px 16px;
    text-align: center;
  }
  .hero-logo {
    width: 64px; height: 64px; border-radius: 50%;
    object-fit: cover; border: 2px solid rgba(255,255,255,0.25);
    margin-bottom: 10px;
    background: rgba(0,0,0,0.4);
  }
  .hero-name {
    font-size: 22px; font-weight: 700; margin: 0 0 4px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
  }
  .hero-tagline {
    font-size: 13px; color: rgba(255,255,255,0.8); margin: 0 0 12px;
    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  }
  .hero-socials { margin-bottom: 0; }

  /* ── HERO GRADIENTE (sin foto, color de marca) ── */
  .hero-gradient {
    width: 100%;
    padding: 40px 16px 32px;
    background: linear-gradient(160deg, var(--accent) 0%, #0a0a0c 130%);
    border-radius: 0 0 24px 24px;
    text-align: center;
    margin-bottom: 20px;
  }
  .hero-gradient-logo {
    width: 96px; height: 96px; border-radius: 50%;
    object-fit: cover; margin: 0 auto 14px; display: block;
    background: #fff;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  }

  /* ── PERFIL CLÁSICO (sin imagen) ── */
  .profile { text-align: center; margin-bottom: 20px; }
  .avatar {
    width: 88px; height: 88px; border-radius: 50%;
    object-fit: cover; margin: 0 auto 14px; display: block;
    border: 2px solid var(--border);
    background: var(--bg-elevated);
  }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 4px; }
  .tagline { color: var(--text-muted); font-size: 14px; margin: 0 0 14px; line-height: 1.5; }

  /* ── SOCIALS ── */
  .socials { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
  .social {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-elevated); border: 1px solid var(--border);
    color: var(--text-primary); text-decoration: none;
    transition: transform 150ms ease, background 150ms ease;
  }
  .social svg { width: 18px; height: 18px; }
  .social:hover { background: var(--bg-elevated-hover); }
  .social:active { transform: scale(0.95); }
  .social:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  /* ── GALERÍA ── */
  .gallery {
    display: flex; gap: 10px;
    overflow-x: auto; scroll-snap-type: x mandatory;
    padding: ${hasHero ? '0 16px 20px' : '0 0 20px'};
    scrollbar-width: none;
  }
  .gallery::-webkit-scrollbar { display: none; }
  .gallery-item {
    flex-shrink: 0; width: 160px; height: 110px;
    border-radius: 14px; overflow: hidden;
    scroll-snap-align: start;
  }
  .gallery-item img {
    width: 100%; height: 100%; object-fit: cover;
    object-position: 50% 70%;
    display: block;
  }

  /* ── BOTONES ── */
  .buttons {
    display: flex; flex-direction: column; gap: 12px;
    padding: ${hasHero ? '0 16px' : '0'};
  }
  .btn {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px; min-height: 44px;
    border-radius: var(--radius);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    color: var(--text-primary); text-decoration: none;
    transition: transform 150ms ease, background 150ms ease;
  }
  .btn:hover { background: var(--bg-elevated-hover); }
  .btn:active { transform: scale(0.98); }
  .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .btn-highlight { color: #fff; border-color: transparent; }
  .btn-highlight:hover { filter: brightness(1.08); }
  .btn-icon {
    width: 40px; height: 40px; flex-shrink: 0;
    border-radius: 50%; background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
  }
  .btn-highlight .btn-icon { background: rgba(255,255,255,0.2); }
  .btn-icon svg { width: 20px; height: 20px; }
  .btn-text { display: flex; flex-direction: column; min-width: 0; }
  .btn-label { font-weight: 600; font-size: 15px; }
  .btn-subtitle { font-size: 13px; color: var(--text-muted); }
  .btn-highlight .btn-subtitle { color: rgba(255,255,255,0.85); }

  footer { text-align: center; margin-top: 36px; }
  footer a { color: var(--text-muted); font-size: 12px; text-decoration: none; font-weight: 600; }

  @media (prefers-reduced-motion: reduce) {
    .btn, .social { transition: none; }
  }
</style>
</head>
<body>
<main>
  ${heroHtml}
  ${galleryHtml}
  <div class="buttons">
    ${buttonsHtml}
  </div>
  <footer><a href="/" target="_blank" rel="noopener">Hecho con AURA</a></footer>
</main>
</body>
</html>`;
}
