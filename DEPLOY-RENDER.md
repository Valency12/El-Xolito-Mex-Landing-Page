# Desplegar el backend gratis en Render

**Recomendación:** [Render](https://render.com) — plan gratuito, conecta con GitHub y despliega Node sin VPS.

## Error `invalid ELF header` / `better-sqlite3`

Suele pasar si **`backend/node_modules` estaba en GitHub** compilado en Windows. Render (Linux) no puede usar esos binarios.

**Solución:**
1. Asegúrate de tener `.gitignore` con `backend/node_modules/`.
2. En tu PC:
   ```bash
   git rm -r --cached backend/node_modules
   git add .gitignore
   git commit -m "fix: quitar node_modules de git para deploy en Render"
   git push
   ```
3. En Render: **Manual Deploy → Clear build cache & deploy**.

---

## Limitaciones del plan gratis (importante)

| Tema | Qué pasa |
|------|----------|
| **Inactividad** | Tras ~15 min sin visitas, el servicio “duerme”. La primera petición puede tardar **30–60 s** en despertar. |
| **SQLite** | La base vive en el servidor de Render. **Cambios en la BD pueden perderse** si Render redeploya o recrea el contenedor. Haz copias del `.db` periódicamente. |
| **Subidas del admin** | Las fotos del panel se guardan en Render (`/uploads`) y se muestran con URL de la API. En plan free, un redeploy puede borrar archivos del disco: vuelve a subir la imagen si desaparece. |
| **Costo** | $0/mes en el plan free de Render. |

Para una joyería empezando, suele bastar. Si crece el tráfico o necesitas BD estable, luego migras a VPS o Postgres.

---

## Paso 1 — Código en GitHub

El repo debe estar en GitHub (ya lo tienes):

`https://github.com/Valency12/El-Xolito-Mex-Landing-Page`

Sube los cambios recientes (`git push`) antes de conectar Render.

---

## Paso 2 — Cuenta en Render

1. Entra a [https://render.com](https://render.com) y regístrate (puedes usar “Sign in with GitHub”).
2. Autoriza acceso a tu repositorio.

---

## Paso 3 — Crear el servicio (opción A: Blueprint)

1. **Dashboard → New → Blueprint**.
2. Conecta el repo `El-Xolito-Mex-Landing-Page`.
3. Render detectará `render.yaml` en la raíz.
4. Revisa variables; puedes dejar las generadas para `JWT_SECRET`.
5. Clic en **Apply**.

---

## Paso 3 — Crear el servicio (opción B: manual)

1. **New → Web Service**.
2. Repo: `El-Xolito-Mex-Landing-Page`.
3. Configuración:

| Campo | Valor |
|--------|--------|
| **Name** | `elxolito-api` |
| **Region** | Oregon (o el más cercano) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

4. **Environment variables** (Environment):

```
NODE_VERSION=20.18.1
JWT_SECRET=pon-una-clave-larga-aleatoria-aqui
JWT_REFRESH_SECRET=otra-clave-larga-diferente
CORS_ORIGINS=https://www.elxolitomex.com,https://elxolitomex.com
ADMIN_EMAIL=admin@elxolitomex.com
```

5. **Create Web Service** y espera el deploy (5–10 min la primera vez).

---

## Paso 4 — Obtener la URL de la API

Cuando termine el deploy, Render muestra una URL como:

```
https://elxolito-api.onrender.com
```

**Tu URL de API para `config.js`:**

```
https://elxolito-api.onrender.com/api
```

Prueba en el navegador:

```
https://elxolito-api.onrender.com/api/health
```

Debe responder: `{"ok":true,"message":"El Xolito Mex API"}`

También prueba productos:

```
https://elxolito-api.onrender.com/api/products?activo=1
```

---

## Paso 5 — Actualizar el frontend en Hostinger

Edita `landing-page/config.js` (en tu PC y vuelve a subir a `public_html`):

```js
window.__EL_XOLITO_API__ = 'https://elxolito-api.onrender.com/api';
window.__EL_XOLITO_SITE_URL__ = 'https://www.elxolitomex.com';
window.__EL_XOLITO_WHATSAPP__ = '5214402000040';
```

(Sustituye `elxolito-api` por el nombre exacto que te dé Render.)

---

## Paso 6 — Verificar desde el sitio

1. Abre `https://www.elxolitomex.com`
2. Entra a **Tienda** — deben cargar productos reales (no solo ejemplos).
3. Prueba **Cotizar por WhatsApp** y el **admin** en `/admin/`.

Si la tienda no carga: abre F12 → Consola → busca errores de CORS o “Failed to fetch”. Revisa que `CORS_ORIGINS` incluya tu dominio con `https://`.

---

## Actualizar la API después

Cada `git push` a `main` puede redeployar automáticamente si activas **Auto-Deploy** en Render (Settings → Build & Deploy).

---

## Alternativas gratuitas (si Render no te convence)

| Servicio | Ventaja | Desventaja |
|----------|---------|------------|
| **Railway** | Muy fácil | Créditos limitados; puede dejar de ser gratis |
| **Fly.io** | Disco persistente (mejor para SQLite) | Configuración más técnica (CLI) |
| **Koyeb** | Free tier simple | Menos documentación en español |

Para empezar, **Render** es la opción más directa.
