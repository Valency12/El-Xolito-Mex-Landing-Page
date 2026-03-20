# Despliegue – El Xolito Mex

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
