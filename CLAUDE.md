# Proyecto: Sistema NFC para negocios (FlowPages)

## ⚠️ Estado actual de la implementación (leer primero)

**Repo git inicializado en esta carpeta — coordinar cambios vía commits, no edición directa
concurrente sin avisar.** Si trabajas desde otra pestaña/sesión al mismo tiempo que otra, haz
`git status`/`git diff` antes de asumir el estado de un archivo.

Ya construido y probado localmente (`npx wrangler pages dev .` en puerto 8788):

- **Router** (`functions/r/[slug].js`): lee `data/redirects.json`. Cada entrada es
  `{ "type": "hub" }` (redirige a `/hub/[slug]`) o `{ "type": "direct", "url": "..." }`
  (redirect directo, nivel Básico, sin hub).
- **Hub** (`functions/hub/[slug].js` + `functions/_shared/renderHub.js`): lee
  `businesses/[slug].json` vía `env.ASSETS.fetch` (binding automático de Pages Functions a los
  assets estáticos del propio sitio) y renderiza la landing tipo Beacons. Soporta dos modos según
  el JSON del negocio: perfil clásico (avatar circular) si no hay `heroImage`, o banner hero
  full-width con overlay si lo hay; además de `gallery` (carrusel horizontal de imágenes,
  opcional).
- **Funnel de reseñas** (`functions/review/[slug].js` + `functions/_shared/renderReview.js`):
  calificación 1-5 estrellas. 4-5★ → redirect a `googleReviewUrl` del negocio. 1-3★ → botón de
  WhatsApp precargado al `ownerWhatsapp` + enlace secundario para igual ir a Google (así se
  respeta la política de Google de no bloquear el paso público, ver sección del funnel más abajo).
- **Config de negocios** en `businesses/*.json` (uno por negocio, no un JSON combinado): ya
  existen `klei-barberia.json` (piloto real, con placeholders `+52XXXXXXXXXX` / `PLACE_ID_AQUI` /
  link de Maps pendientes de datos reales) y `starbucks.json` (demo usada para probar el modo
  hero + galería).
- Iconos: SVGs propios dibujados a mano en `functions/_shared/icons.js` (no hay libraría de
  íconos ni emojis), referenciados por nombre desde el JSON de cada negocio.

**Pendiente / próximos pasos:**
- Analytics de escaneos por slug y por rama del funnel (requiere Cloudflare KV o D1 — no
  configurado todavía, hasta ahora todo es JSON estático en el repo).
- Conectar el repo a GitHub + desplegar el proyecto a Cloudflare Pages (todavía no hay remoto).
- Reemplazar placeholders de Klei Barbería con datos reales (WhatsApp, Place ID de Google, link
  de Maps).
- Definir si negocios nivel Básico (`type: "direct"`) se van a usar pronto o si por ahora todos
  arrancan en Pro/Premium con hub.

## Contexto de negocio

Alfredo compró varias tarjetas NFC para revenderlas/ofrecerlas como servicio a negocios locales
(barberías, doctores, nail salons, restaurantes, retail, etc.) bajo su marca FlowPages.

La idea original era simple: programar el chip para mandar directo a las reseñas de Google
(más reseñas = más clientes potenciales que confían en el negocio). Pero el plan evolucionó a
un servicio mucho más completo, con dos piezas centrales: un **router propio** y un
**funnel de reseñas inteligente**. Esto es lo que hace que el producto valga más que una
tarjeta NFC genérica de Amazon, y lo que justifica venderlo como servicio recurrente
(retainer), no como venta única.

Stack disponible: Cloudflare Pages (con Pages Functions), vanilla HTML/CSS/JS, dominios tipo
`flowpages.pages.dev`. Se trabaja vía Claude Code en la IDE Antigravity.

---

## PROTOCOLO — CREAR PÁGINA NUEVA PARA UN NEGOCIO

Cuando Alfredo diga "crea una página para [NEGOCIO]", seguir estos pasos exactos:

### Paso 1 — Preguntar solo lo esencial (si no se dio)
Pedir únicamente lo que no se puede inferir:
- ¿Cuál es el slug? (ej: `starbucks-centro`, `klei-barberia`)
- ¿Tiene logo o foto del negocio para usar, o usar imágenes de demostración?
- ¿Cuál es el color principal de la marca?
- ¿Cuál es el link de reseñas de Google y el número de WhatsApp del dueño?

Si el negocio es una marca reconocida (Starbucks, McDonald's, Oxxo, etc.), inferir:
- Color de marca
- Estilo visual
- Imágenes de demostración desde Unsplash con búsqueda por tipo de negocio

### Paso 2 — Crear el archivo JSON en `businesses/`

Formato completo del JSON:

```json
{
  "name": "Nombre del negocio",
  "tagline": "Frase corta y atractiva (máx 6 palabras)",
  "logo": "URL del logo (circular, se ve bien en 64x64px)",
  "heroImage": "URL de imagen de portada (horizontal, mínimo 800px de ancho)",
  "accentColor": "#HEXCOLOR",
  "googleReviewUrl": "https://search.google.com/local/writereview?placeid=PLACE_ID",
  "ownerWhatsapp": "+52XXXXXXXXXX",
  "gallery": [
    "URL imagen 1 (ratio 3:2 ideal)",
    "URL imagen 2",
    "URL imagen 3",
    "URL imagen 4 (máximo 4)"
  ],
  "socials": {
    "instagram": "https://instagram.com/...",
    "whatsapp": "https://wa.me/52...",
    "facebook": "https://facebook.com/...",
    "web": "https://..."
  },
  "buttons": [
    {
      "label": "Dejar una reseña",
      "subtitle": "Tu opinión nos ayuda mucho",
      "icon": "star",
      "url": "/review/[slug]",
      "highlight": true
    },
    {
      "label": "WhatsApp / Agendar",
      "subtitle": "Escríbenos directo",
      "icon": "chat",
      "url": "https://wa.me/52XXXXXXXXXX?text=..."
    },
    {
      "label": "Cómo llegar",
      "subtitle": "Ver en Google Maps",
      "icon": "map-pin",
      "url": "https://maps.app.goo.gl/..."
    }
  ]
}
```

**Iconos disponibles:** `star`, `chat`, `map-pin`, `camera`, `globe`, `music`, `link`, `calendar`

### Paso 3 — Registrar el slug en `data/redirects.json`

Agregar la entrada:
```json
"[slug]": { "type": "hub" }
```

### Paso 4 — Confirmar a Alfredo

Reportar:
- Slug activo: `/hub/[slug]`
- Funnel de reseñas activo: `/review/[slug]`
- Qué datos están como placeholder (Place ID de Google, teléfono, etc.) para que los complete

---

## IMÁGENES — GUÍA DE USO

### Para negocios reales de clientes
El cliente proporciona las fotos. Alfredo las sube a una URL accesible (Cloudflare R2, GitHub, Imgur, etc.) y se colocan en el JSON.

### Para demostraciones / ejemplos de venta
Usar imágenes gratuitas de **Unsplash** con este formato:
```
https://images.unsplash.com/photo-[ID]?w=800&q=80   ← hero (ancho)
https://images.unsplash.com/photo-[ID]?w=400&q=80   ← galería (cuadradas)
```

**Búsquedas por tipo de negocio para demos:**
- Café/Starbucks: `coffee shop`, `latte`, `espresso`, `barista`
- Barbería: `barbershop`, `haircut`, `barber`
- Restaurante: `restaurant interior`, `food plating`
- Nail salon: `nail art`, `manicure`
- Gym/fitness: `gym workout`, `weights`
- Médico/clínica: `medical office`, `clinic`
- Retail/tienda: `boutique store`, `retail`

**Regla:** el hero siempre tiene mínimo 800px de ancho. Las imágenes de galería, 400px.

### Colores de marca de negocios reconocidos (referencia rápida)
| Negocio | Color |
|---------|-------|
| Starbucks | `#00704A` |
| McDonald's | `#DA291C` |
| Oxxo | `#EE1C25` |
| Domino's | `#006491` |
| Cinépolis | `#E31837` |
| Sears | `#003087` |
| Liverpool | `#C8102E` |

---

## ESTRUCTURA DEL PROYECTO

```
NFC PLAN/
├── businesses/          ← un JSON por negocio
│   ├── klei-barberia.json
│   └── starbucks.json
├── data/
│   └── redirects.json   ← registra qué slugs existen y su tipo
├── functions/
│   ├── r/[slug].js      ← router de redirect rápido
│   ├── hub/[slug].js    ← sirve la landing hub del negocio
│   ├── review/[slug].js ← sirve el funnel de reseñas
│   └── _shared/
│       ├── renderHub.js    ← genera HTML del hub (soporta hero + galería)
│       ├── renderReview.js ← genera HTML del funnel de reseñas
│       └── icons.js        ← SVG paths de iconos
└── index.html           ← página de inicio del dominio
```

**Rutas activas por negocio:**
- `/r/[slug]` → redirect instantáneo al hub (va grabado en el chip NFC)
- `/hub/[slug]` → landing page visual del negocio
- `/review/[slug]` → funnel de calificación → Google o WhatsApp

---

## Pieza 1: Router propio (no grabar el destino final en el chip)

### El problema que resuelve
Un chip NFC típico (NTAG213/215/216) trae grabado un registro NDEF con una URL **fija**. Si se
graba ahí directo el link de reseñas de Google, cambiar el destino después requiere tener la
tarjeta física en mano + una app de regrabado (ej. "NFC Tools") — imposible una vez que el
cliente ya tiene la tarjeta.

### La solución
Grabar en el chip una URL corta y fija, propia, tipo:

```
flowpages.pages.dev/r/klei-barberia
```

Esa página no es el destino final — es un "router". Existe una tabla (JSON simple o Cloudflare
KV) que mapea el slug a la URL real:

```
klei-barberia -> https://g.page/r/xxxx/review
```

Al escanear, el servidor lee el slug, busca el destino, y hace un redirect 302 instantáneo. El
usuario no percibe el intermediario.

### Por qué vale como servicio (no solo como feature técnica)
- **Cambiar el destino sin tocar el chip físico**: si el negocio lanza una promo, se cambia
  temporalmente el destino y luego se regresa a reseñas — todo desde un panel/código, sin
  reprogramar nada.
- **Analytics de escaneos**: cada paso por el router se puede contar (+1 por escaneo). Ningún
  chip "crudo" da esto. Es un upsell claro: dashboard de "tu tarjeta se escaneó X veces este
  mes".
- **Modelo de negocio recurrente**: el negocio paga por "gestión y actualización del destino",
  encajando con el modelo de retainers que Alfredo ya quiere construir en FlowPages.

---

## Pieza 2: Funnel de reseñas inteligente

### La idea
En vez de mandar a todos directo a Google, primero se pregunta cómo fue la experiencia:

```
"¿Cómo estuvo tu experiencia en [Negocio]?"
⭐⭐⭐⭐⭐
```

- **4-5 estrellas** → redirect automático al link de "escribir reseña" de Google.
- **1-3 estrellas** → WhatsApp precargado al dueño para resolver en privado. Opción de ir a
  Google de todas formas (para cumplir políticas de Google contra review gating).

---

## Empaquetado sugerido para venta

1. **Básico** — solo reseñas de Google (sin router propio).
2. **Pro** — router propio + landing hub con imágenes + reseñas + WhatsApp.
3. **Premium** — todo lo anterior + funnel de reseñas inteligente + analytics de escaneos +
   mantenimiento mensual (retainer).

---

## Negocios activos

| Slug | Negocio | Estado |
|------|---------|--------|
| `klei-barberia` | Klei Barbería | ✅ Activo |
| `starbucks` | Starbucks (demo) | 🎯 Demo |

---

## Próximos pasos técnicos

1. Conectar `functions/hub/[slug].js` para leer el JSON del negocio y servir el HTML
2. Verificar que `functions/r/[slug].js` apunte correctamente al hub
3. Agregar Place ID real de Starbucks / Klei en sus respectivos JSON
4. Escalar a nuevos clientes usando el protocolo de creación de este documento
