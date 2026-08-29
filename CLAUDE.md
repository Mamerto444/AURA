# Proyecto: Sistema NFC para negocios (TapGo)

**Nota de marca:** el nombre visible al cliente es **TapGo** (antes RAVE, antes de eso AURA,
antes de eso FlowPages). La infraestructura técnica (repo GitHub `Mamerto444/AURA`, proyecto
Cloudflare Pages `aura`, dominio `aura-dre.pages.dev`) sigue usando "aura" internamente — no se
renombró porque eso implicaría mover el dominio y romper las URLs ya grabadas en las tarjetas NFC
de Klei Barbería y ElegansNails, que están en producción. Todo el copy visible (landing, footer
de los hubs, dashboard de stats) ya dice "TapGo". Cuenta de Instagram de la marca: **@tapgo_mx**.

## ⚠️ Estado actual de la implementación (leer primero)

**Repo git inicializado en esta carpeta — coordinar cambios vía commits, no edición directa
concurrente sin avisar.** Si trabajas desde otra pestaña/sesión al mismo tiempo que otra, haz
`git status`/`git diff` antes de asumir el estado de un archivo.

Ya construido y probado localmente (`npx wrangler pages dev .` en puerto 8788):

- **Router** (`functions/r/[slug].js`): lee `data/redirects.json`. Cada entrada es
  `{ "type": "hub" }` (redirige a `/hub/[slug]`), `{ "type": "direct", "url": "..." }`
  (redirect directo a una URL ya asignada, ej. Básico activado), o `{ "type": "pending" }`
  (redirect a `/pendiente.html` — código del pool de Básico aún no vendido, ver "Pieza 4").
- **Hub** (`functions/hub/[slug].js` + `functions/_shared/renderHub.js`): lee
  `businesses/[slug].json` vía `env.ASSETS.fetch` (binding automático de Pages Functions a los
  assets estáticos del propio sitio) y renderiza la landing tipo Beacons. Soporta dos modos según
  el JSON del negocio: perfil clásico (avatar circular) si no hay `heroImage`, o banner hero
  full-width con overlay si lo hay; además de `gallery` (carrusel horizontal de imágenes,
  opcional).
- **Funnel de reseñas** (`functions/review/[slug].js` + `functions/_shared/renderReview.js`):
  calificación 1-5 estrellas. 4-5★ → redirect a `googleReviewUrl` del negocio. 1-3★ → solo
  mensaje de agradecimiento, sin acción de contacto (se quitó el botón de WhatsApp que existía
  antes en esta rama).
- **Config de negocios** en `businesses/*.json` (uno por negocio, no un JSON combinado): ya
  existen `klei-barberia.json` (piloto real, con placeholders `+52XXXXXXXXXX` / `PLACE_ID_AQUI` /
  link de Maps pendientes de datos reales) y `starbucks.json` (demo usada para probar el modo
  hero + galería).
- Iconos: SVGs propios dibujados a mano en `functions/_shared/icons.js` (no hay libraría de
  íconos ni emojis), referenciados por nombre desde el JSON de cada negocio.
- **Analytics** (`functions/track/[slug].js` + `functions/stats/[slug].js`): cada escaneo en
  `functions/r/[slug].js` se registra en el namespace KV `ANALYTICS` (binding declarado en
  `wrangler.toml`, id `c573da784a2a42c8afbee5d480c30623`) vía `waitUntil`, sin bloquear el
  redirect — guarda conteo total, última fecha de escaneo y desglose mensual. El funnel de
  reseñas manda un `navigator.sendBeacon` a `/track/[slug]` en cada calificación, separando
  positivas (4-5★, van a Google) de negativas (1-3★). `/stats/[slug]?key=...` expone un
  dashboard de métricas por negocio (escaneos totales, tasa de satisfacción, historial mensual),
  protegido por query param `key`.
- Klei Barbería ya tiene datos reales completos (WhatsApp, Maps, Place ID, logo propio en
  `assets/klei-barberia/`) — ya no hay placeholders pendientes ahí.
- **Panel de WiFi en el hub** (agregado 2026-08-11 — ver "Pieza 3" más abajo): un botón más en
  `buttons[]` con un objeto `wifi: { ssid, password, encryption, qrImage? }` en vez de `url`.
  `renderHub.js` lo detecta y renderiza un panel expandible (`<details>`) con el nombre de la
  red, la contraseña con botón de copiar, y un QR — generado en el servidor con la librería
  vendorizada `functions/_shared/qrcode-gen.js` (MIT, kazuhikoarase, sin llamadas a terceros) si
  no se da `qrImage`, o la imagen que suba el cliente si sí se da. Ya está activo en ambas
  sucursales de ElegansNails, cada una con su propia red/imagen — no hay riesgo de mezclarlas
  porque cada slug lee su propio JSON.
- **Repo conectado a GitHub** (`github.com/Mamerto444/AURA`) y **desplegado en Cloudflare
  Pages**: `https://aura-dre.pages.dev`. El nombre del proyecto en `wrangler.toml` es `aura`.
- **Pool de códigos genéricos para Básico** (agregado 2026-08-11 — ver "Pieza 4" más abajo): 20
  slugs pre-generados tipo `rv-xxxx` en `data/redirects.json`, todos con `{ "type": "pending" }`,
  pensados para grabarse en tarjetas físicas en lote *antes* de tener cliente. Mientras un código
  no se asigna, `/r/[código]` manda a `pendiente.html` (landing "tarjeta aún no activada" con CTA
  de WhatsApp). Activar un código = cambiar su entrada a `{ "type": "direct", "url": "..." }` con
  el `googleReviewUrl` real del negocio y hacer commit/push — no requiere tocar la tarjeta física.

**Pendiente / próximos pasos:**
- Subir logo real de ElegansNails (sigue usando placeholder según la tabla de negocios activos).
- Completar `googleReviewUrl` real de la sucursal Parián (`elegans-nails-parian.json` sigue con
  el placeholder `PLACE_ID_AQUI`).
- Confirmar si `aura-dre.pages.dev` es el dominio final para grabar en chips NFC / imprimir QRs,
  o si se va a conectar un dominio propio más adelante.

## Contexto de negocio

Alfredo compró varias tarjetas NFC para revenderlas/ofrecerlas como servicio a negocios locales
(barberías, doctores, nail salons, restaurantes, retail, etc.) bajo su marca AURA.

La idea original era simple: programar el chip para mandar directo a las reseñas de Google
(más reseñas = más clientes potenciales que confían en el negocio). Pero el plan evolucionó a
un servicio mucho más completo, con dos piezas centrales: un **router propio** y un
**funnel de reseñas inteligente**. Esto es lo que hace que el producto valga más que una
tarjeta NFC genérica de Amazon, y lo que justifica venderlo como servicio recurrente
(retainer), no como venta única.

Stack disponible: Cloudflare Pages (con Pages Functions), vanilla HTML/CSS/JS, dominios tipo
`aura.pages.dev`. Se trabaja vía Claude Code en la IDE Antigravity.

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
  "theme": "dark",
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

**Iconos disponibles:** `star`, `chat`, `map-pin`, `camera`, `globe`, `music`, `link`, `calendar`,
`instagram`, `facebook`, `tiktok`, `phone`, `mail`, `gift`, `wifi`

**Tema visual:** `theme` acepta `"dark"` (default, fondo negro `#0a0a0c`) o `"light"` (fondo
cálido `#faf7f2`, texto oscuro) — ambos definidos en `functions/_shared/themes.js`. Elegir según
la marca: negro para negocios con estética moderna/nocturna, claro para negocios con logo/imagen
de fondo blanco o estética elegante (ej. `elegans-nails`, tema `light`).

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
│   ├── starbucks.json
│   ├── elegans-nails.json         ← sucursal Vicente Guerrero
│   └── elegans-nails-parian.json  ← sucursal El Parián
├── data/
│   └── redirects.json   ← registra qué slugs existen y su tipo
├── assets/
│   └── [slug]/           ← logos e imágenes propias de cada negocio (ej. QR de WiFi)
├── functions/
│   ├── r/[slug].js      ← router de redirect rápido
│   ├── hub/[slug].js    ← sirve la landing hub del negocio
│   ├── review/[slug].js ← sirve el funnel de reseñas
│   └── _shared/
│       ├── renderHub.js    ← genera HTML del hub (soporta hero + galería + panel WiFi)
│       ├── renderReview.js ← genera HTML del funnel de reseñas
│       ├── icons.js        ← SVG paths de iconos
│       └── qrcode-gen.js   ← librería QR vendorizada (MIT), usada por el panel de WiFi
├── index.html            ← página de inicio del dominio
└── pendiente.html        ← landing para códigos del pool Básico aún no activados (ver Pieza 4)
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
aura.pages.dev/r/klei-barberia
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
  encajando con el modelo de retainers que Alfredo ya quiere construir en AURA.

---

## Pieza 2: Funnel de reseñas inteligente

### La idea
En vez de mandar a todos directo a Google, primero se pregunta cómo fue la experiencia:

```
"¿Cómo estuvo tu experiencia en [Negocio]?"
⭐⭐⭐⭐⭐
```

- **4-5 estrellas** → redirect automático al link de "escribir reseña" de Google.
- **1-3 estrellas** → solo mensaje de agradecimiento, sin acción de contacto hacia el dueño.

---

## Pieza 3: Panel de "Conéctate a WiFi" en el hub

### El problema que resuelve
Un link web (el hub) no puede conectar automáticamente el WiFi del celular de quien lo visita —
eso solo existe si se graba un chip NFC *dedicado* con un registro nativo de WiFi (no una URL), y
ni así funciona en iPhone. Como el chip que graba Alfredo ya lleva la URL del router
(`aura-dre.pages.dev/r/[slug]`), esa vía no aplica.

### La solución implementada
Un botón más en `buttons[]` del JSON del negocio, con un objeto `wifi` en vez de `url`:

```json
{
  "label": "Conéctate a WiFi",
  "subtitle": "Copia la contraseña en un toque",
  "icon": "wifi",
  "wifi": {
    "ssid": "NombreDeLaRed",
    "password": "contraseña",
    "encryption": "WPA",
    "qrImage": "/assets/[slug]/wifi-qr.png"
  }
}
```

- `qrImage` es **opcional**. Si no se da, `renderHub.js` genera el QR en el servidor con
  `functions/_shared/qrcode-gen.js` (SVG, sin llamadas a terceros, sin JS del lado del cliente).
  Si el cliente manda su propia foto/captura del QR del router, se guarda en
  `assets/[slug]/algún-nombre.png` y se referencia ahí — se usa esa imagen tal cual en vez de
  generar una.
- El botón se renderiza como un `<details>` que expande un panel con: nombre de red, contraseña
  con botón "Copiar" (Clipboard API con fallback a `execCommand`), y el QR debajo (orden acordado
  con Alfredo: Red → Contraseña → QR).
- Apuntar la cámara nativa del celular (no la del navegador) al QR ofrece "Unirse a la red" sin
  escribir nada — es el método más cercano a "un toque" que existe sin chip NFC dedicado.
- Cada sucursal/negocio tiene su propio JSON con su propia red — no hay riesgo de que un QR o
  contraseña de una sucursal aparezca en el hub de otra.

### Cómo agregarlo a un negocio nuevo
1. Pedir SSID y contraseña de la red (y, si el cliente tiene una foto del QR de su router,
   pedirla también — si no, se genera automático).
2. Si hay imagen, guardarla en `assets/[slug]/` con nombre descriptivo.
3. Agregar el botón `wifi` al JSON del negocio (normalmente al final de `buttons[]`, salvo que
   Alfredo pida otro orden).
4. Probar en local (`wrangler pages dev`) antes de hacer commit/push.

---

## Pieza 4: Pool de tarjetas Básico pre-fabricadas (venta en frío, entrega inmediata)

### El problema que resuelve
Para el paquete Básico ($400, sin hub, redirect directo a reseñas), fabricar/imprimir un QR
distinto por cada cliente significa no poder cerrar una venta en frío en el momento — hay que
esperar a mandar a hacer la tarjeta con el destino ya grabado, típicamente 1-2 días.

### La solución implementada
El chip NFC de Básico **también** lleva grabada una URL de router (`aura-dre.pages.dev/r/[código]`),
igual que Pro — la diferencia de nivel es que Básico no tiene hub, solo redirect directo. Eso
permite pre-fabricar un lote de tarjetas con códigos genéricos *antes* de tener cliente:

1. Se generan slugs cortos aleatorios tipo `rv-x7k9` (formato `rv-` + 4 caracteres alfanuméricos,
   evitando caracteres ambiguos como `0/o`, `1/l/i`) y se registran en `data/redirects.json` como
   `{ "type": "pending" }`.
2. Ese lote se manda a grabar/imprimir de una sola vez (más barato por volumen que uno por uno).
3. Mientras un código no se vende, `/r/[código]` redirige a `/pendiente.html` — landing con marca
   TapGo que dice "esta tarjeta aún no está activada" + botón de WhatsApp (por si alguien la
   escanea antes de tiempo, es un lead entrante gratis).
4. Al cerrar una venta: Alfredo toma una tarjeta ya fabricada del inventario, cambia su entrada en
   `data/redirects.json` de `{ "type": "pending" }` a `{ "type": "direct", "url": "<googleReviewUrl
   del negocio>" }`, hace commit + push a GitHub — Cloudflare Pages redeploya solo. Menos de 5
   minutos, cero reimpresión, cero regrabado del chip.

### Lote inicial (2026-08-11)
20 códigos generados y cargados en `data/redirects.json`, todos `pending`: `rv-v4b3`, `rv-5gvw`,
`rv-rsqk`, `rv-xq5m`, `rv-ydnb`, `rv-hvjw`, `rv-hrz8`, `rv-anp4`, `rv-hrnq`, `rv-b8je`, `rv-5gt5`,
`rv-ys4m`, `rv-gw25`, `rv-rzy9`, `rv-kuhh`, `rv-drqx`, `rv-g25p`, `rv-puwf`, `rv-brrd`, `rv-y5uh`.
Ninguno está grabado en tarjeta física todavía ni asignado a cliente — eso lo hace Alfredo fuera
de este repo (grabado con app tipo "NFC Tools" + impresión del QR correspondiente a cada URL
`aura-dre.pages.dev/r/[código]`).

### Nota importante sobre el pitch de venta
Técnicamente nada impide reactivar/cambiar el destino de un código Básico ya vendido (sigue
siendo solo JSON) — pero el paquete se vende como "destino fijo, sin actualización" para que la
diferencia con Pro (que sí paga por poder cambiar el destino) tenga sentido comercial. Es una
regla de proceso interno, no una limitación técnica.

### Cómo activar un código del pool
1. Elegir un código `pending` disponible de `data/redirects.json` (o generar más si el lote se
   agota — mismo formato `rv-xxxx`).
2. Pedir al cliente su `googleReviewUrl` real (link de "escribir reseña" de Google).
3. Cambiar su entrada a `{ "type": "direct", "url": "<link>" }` en `data/redirects.json`.
4. Commit + push. Confirmar a Alfredo qué código quedó asignado a qué negocio (para que sepa qué
   tarjeta física entregar).

---

## Empaquetado y precios (vigente — reflejado en `index.html`)

1. **Básico — $400 MXN pago único**: tarjeta NFC física + redirect directo a reseñas de Google
   (sin hub). Usa el mismo router que Pro por dentro (ver "Pieza 4"), pero al cliente se le vende
   como destino fijo, sin panel de actualización.
2. **Pro — $800 MXN pago único**: router propio (destino actualizable sin comprar otra tarjeta) +
   landing hub con fotos/galería + WhatsApp/redes + funnel inteligente de reseñas + contador de
   escaneos.

Descuento por volumen (reflejado en `index.html`): 2 tarjetas $700 c/u, 5+ tarjetas $600 c/u.

Se descartó el tercer nivel "Premium" con retainer mensual — por ahora solo 2 paquetes, ambos de
pago único, para bajar la fricción de la primera venta.

---

## Negocios activos

| Slug | Negocio | Estado |
|------|---------|--------|
| `klei-barberia` | Klei Barbería | ✅ Activo |
| `starbucks` | Starbucks (demo) | 🎯 Demo |
| `elegans-nails` | ElegansNails — sucursal Vicente Guerrero | ✅ Activo, con panel de WiFi (falta subir logo real) |
| `elegans-nails-parian` | ElegansNails — sucursal El Parián | ✅ Activo, con panel de WiFi (falta `googleReviewUrl` real) |

---

## Próximos pasos técnicos

1. Subir logo real de ElegansNails (sigue con placeholder).
2. Completar el `googleReviewUrl` real de la sucursal Parián.
3. Confirmar dominio final (`aura-dre.pages.dev` vs. dominio propio) antes de grabar chips NFC
   o imprimir QRs en producción.
4. Escalar a nuevos clientes usando el protocolo de creación de este documento.
5. Mandar a fabricar/grabar físicamente el lote de 20 tarjetas del pool Básico (ver "Pieza 4") —
   por ahora solo existen como códigos en `data/redirects.json`, ninguna tarjeta física está
   grabada todavía.

---

## Bitácora de sesiones

- **2026-08-11** — Se agregó el panel de "Conéctate a WiFi" al hub (ver "Pieza 3"): librería QR
  vendorizada en `functions/_shared/qrcode-gen.js`, soporte de botón tipo `wifi` en
  `renderHub.js`, e ícono `wifi` en `icons.js`. Activado en ambas sucursales de ElegansNails
  (`elegans-nails.json` y `elegans-nails-parian.json`), cada una con su propia red y su propia
  imagen de QR provista por Alfredo (`assets/elegans-nails/wifi-qr.jpg.png` para Vicente,
  `assets/elegans-nails/wifi-qr-parian.png.png` para Parián — ambas comparten la misma carpeta
  de assets, no hay carpeta separada por sucursal). Ya está en `master` y desplegado.
- **2026-08-11** — Se agregó el pool de tarjetas Básico pre-fabricadas (ver "Pieza 4"): nuevo tipo
  `{ "type": "pending" }` en el router (`functions/r/[slug].js`) y página `pendiente.html` para
  códigos aún no vendidos. Se generaron y cargaron 20 slugs `rv-xxxx` en `data/redirects.json`.
  Objetivo: cerrar ventas de Básico en frío sin esperar a fabricar un QR por cliente — Alfredo
  solo reasigna un código ya existente al `googleReviewUrl` del negocio y hace push. Probado
  localmente con `wrangler pages dev` (router, hub y página pendiente respondiendo correcto).
  Falta fabricar/grabar las tarjetas físicas correspondientes a esos 20 códigos — ver "Próximos
  pasos técnicos".
- **2026-08-27** — Rebranding de RAVE a **TapGo** (nombre visible al cliente). Alfredo ya creó la
  cuenta de Instagram de la marca (`@tapgo_mx`). Se actualizó el copy en `index.html` (título,
  meta tags, wordmark del hero, textos de los botones de WhatsApp, footer), `pendiente.html`
  (título, wordmark, texto de la tarjeta no activada), `functions/stats/[slug].js` (título y
  wordmark del dashboard), `functions/_shared/renderHub.js` (footer "Hecho by TapGo" en cada
  hub) y el comentario de licencia en `functions/_shared/qrcode-gen.js`. La infraestructura
  técnica (repo `Mamerto444/AURA`, proyecto Cloudflare `aura`, dominio `aura-dre.pages.dev`) se
  mantiene sin cambios, mismo criterio que en rebrands anteriores (ver nota de marca al inicio de
  este documento). Pendiente: subir el nuevo link/handle de Instagram donde aplique en la landing
  si Alfredo lo pide, y revisar si algún `businesses/*.json` menciona "RAVE" en texto libre.
