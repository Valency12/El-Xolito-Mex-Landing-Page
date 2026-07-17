# Despliegue – El Xolito Mex

> **Backend gratis:** guía paso a paso en **[DEPLOY-RENDER.md](./DEPLOY-RENDER.md)** (Render + GitHub, $0/mes).

## Hostinger (paso a paso)

Tienes **dos piezas** que desplegar por separado:

| Pieza | Qué subes | Dónde en Hostinger |
|--------|-----------|-------------------|
| **Sitio web** | Todo el contenido de `landing-page/` | `public_html` (hosting web) |
| **API (Node)** | Carpeta `backend/` (sin `node_modules`) | VPS Hostinger **o** plan con Node.js en hPanel |

> **No basta con “subir de nuevo los archivos”** si solo cambias el HTML: también debes editar `config.js` en producción y tener la **API corriendo** en internet. Sin API, la tienda no carga productos reales ni registra pedidos.

### 1. Frontend en `public_html`

1. Entra a **hPanel → Archivos → Administrador de archivos → public_html**.
2. Sube el **contenido** de `landing-page/` (no la carpeta vacía; los archivos dentro):
   - `index.html`, `tienda.html`, `producto.html`, `mi-cuenta.html`
   - `main.js`, `style.css`, `config.js`
   - carpetas `assets/`, `services/`, `admin/`
3. Edita `config.js` **en el servidor** (o antes de subir):

```js
window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';
window.__EL_XOLITO_SITE_URL__ = 'https://tudominio.com';
window.__EL_XOLITO_WHATSAPP__ = '5214402000040';
```

- `__EL_XOLITO_SITE_URL__` es importante para que los enlaces de **fotos y productos** en WhatsApp salgan completos (`https://...`).
- Activa **SSL** en Hostinger (Let's Encrypt) para `tudominio.com` y `www`.

### 2. Backend (API)

El hosting **solo estático** no ejecuta Node de forma persistente. Opciones:

**A) VPS Hostinger (recomendado si ya tienes o planeas VPS)**

1. Conéctate por SSH.
2. Instala Node 20, sube `backend/`, `database/`, corre `npm install` dentro de `backend/`.
3. Crea `.env`:

```bash
PORT=3000
JWT_SECRET=una-clave-larga-y-secreta
CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
```

4. Apunta un subdominio `api.tudominio.com` al VPS (registro A en DNS).
5. Usa **nginx** o **Caddy** como proxy HTTPS → `localhost:3000`.
6. Mantén el proceso vivo con **PM2**: `pm2 start server.js --name elxolito-api`.

**B) Plan Hostinger con Node.js (si tu plan lo incluye)**

1. hPanel → **Node.js** → crear aplicación apuntando a `backend/server.js`.
2. Variables de entorno igual que arriba.
3. La URL que te den (ej. `https://api.tudominio.com`) va en `config.js`.

**Base de datos:** copia `database/el_xolito_mex.db` al servidor en una ruta persistente. Haz **copias de seguridad** periódicas.

### 3. Verificar que todo funciona

1. `https://tudominio.com` — la landing carga.
2. `https://api.tudominio.com/api/health` — responde `{"ok":true,...}`.
3. Tienda muestra productos (no solo ejemplos).
4. Carrito → **Cotizar por WhatsApp** abre el chat con nombre, cantidades, precios y enlaces.

### 4. Cotización por WhatsApp (cómo funciona)

- El botón arma un mensaje con: **nombre**, **cantidad**, **precio**, **material**, **enlace al producto** y **enlace a la foto**.
- WhatsApp **no permite adjuntar imágenes** automáticamente desde la web; por eso la foto va como **URL** que tú o el cliente pueden abrir.
- Si el cliente **inició sesión**, al cotizar desde el carrito se **registra el pedido** en el admin y el mensaje incluye `#pedido`.
- Sin sesión, igual puede cotizar; solo no queda registrado en el panel.

---

## Qué has subido ahora (solo la landing)

Si en el host solo hay **archivos estáticos** (HTML, CSS, JS, imágenes en `assets/`):

- La web **se ve** y puede usar **productos de ejemplo** si la API no responde.
- **Registro, login, carrito en servidor y pedidos** solo funcionan si el navegador puede llamar a una **API real** por HTTPS (o mismo origen con proxy).

## Dos piezas

| Pieza | Dónde vive | Requisitos |
|--------|------------|------------|
| **Frontend** | Tu dominio actual (host estático) | Subir toda la carpeta `landing-page/` (incl. `config.js`, `services/`, `main.js`, `style.css`, `assets/`). |
| **Backend (API)** | Otro servicio o subdominio | **Node.js** (Express), variables de entorno, base de datos (SQLite en disco o PostgreSQL en la nube). |

No basta con “subir el repo”: el **servidor Node** debe ejecutarse en un entorno que soporte procesos persistentes (VPS, Railway, Render, Fly.io, DigitalOcean App Platform, etc.).

## Configurar la URL de la API en producción

1. Sube `landing-page/config.js` junto al resto.
2. Edita **una** de estas opciones:

   **Opción A** – En `config.js`:

   ```js
   window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';
   ```

   **Opción B** – En cada HTML, **antes** de `config.js`:

   ```html
   <script>window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';</script>
   <script src="config.js"></script>
   ```

La URL debe terminar en `/api` (sin barra final). En local, el valor por defecto sigue siendo `http://localhost:3000/api`.

## Backend en producción

1. Variables útiles (ejemplo):

   - `PORT` – puerto que escucha el proceso.
   - `JWT_SECRET` / claves que ya uses en `.env` – **nunca** en el repositorio.
   - `CORS_ORIGINS` – orígenes permitidos, separados por comas:

     ```bash
     CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
     ```

     Sin `CORS_ORIGINS`, el servidor acepta cualquier origen (útil en desarrollo; en producción conviene restringir).

2. **SQLite**: el archivo de base debe estar en **disco persistente** en el host. En plataformas “efímeras” sin volumen, considera **PostgreSQL** (managed).

3. **HTTPS**: el frontend en HTTPS no puede llamar de forma fiable a una API solo HTTP; usa HTTPS en la API o un proxy (nginx/Caddy) con certificado.

## Resumen: “¿hasta dónde puedo subir todo lo demás?”

- **Todo el frontend** → mismo host estático que ya usas, si subes **toda** la carpeta `landing-page` y configuras `__EL_XOLITO_API__`.
- **Backend + base de datos** → **no** van al mismo “solo estáticos”; van a un **segundo despliegue** (Node + env + almacenamiento o Postgres).
- **Opción un solo dominio**: servir estáticos en `/` y **proxy reverso** `/api` → proceso Node en el mismo servidor (VPS).

Para probar: `GET https://tu-api/api/health` debe responder `{"ok":true,...}`.
