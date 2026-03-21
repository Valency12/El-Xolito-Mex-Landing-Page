# El Xolito Mex – Landing y Tienda

## Cómo ejecutar el proyecto

Necesitas **dos terminales**: una para el backend y otra para el frontend.

### 1. Backend (API)

```bash
cd backend
npm install
npm run db:init
npm start
```

- Si en Linux falla la compilación de `better-sqlite3`: `sudo apt install build-essential` y vuelve a hacer `npm install`.
- El servidor quedará en **http://localhost:3000**.

### 2. Frontend (landing y tienda)

Desde la **raíz del proyecto**:

```bash
cd landing-page
npx serve -l 8080
```

O con Python:

```bash
cd landing-page
python3 -m http.server 8080
```

- Abre en el navegador: **http://localhost:8080** (o el puerto que uses).
- Para la tienda: **http://localhost:8080/tienda** (sin `.html` para conservar parámetros como `?categoria=anillos`).

**Importante:** el frontend llama a la API en `http://localhost:3000`. Si no levantas el backend, la tienda usará productos de ejemplo.

### Registro y pago (checkout)

- **Registro / login:** formularios en la landing (`index.html`) y modales en **tienda** y **producto** (icono de perfil). Contraseña: mínimo 8 caracteres, mayúscula, minúscula y número (validado en cliente y servidor).
- **Proceder al pago:** requiere **sesión iniciada**. Si no hay cuenta, se abre el login; al iniciar sesión o registrarse se sincroniza el carrito local con el backend y se crea un pedido (`POST /api/orders`). El backend debe estar en marcha y los productos del carrito deben existir en la base (IDs alineados con la API).

### Resumen rápido

| Terminal 1 (backend) | Terminal 2 (frontend) |
|---------------------|------------------------|
| `cd backend && npm install && npm run db:init && npm start` | `cd landing-page && npx serve -l 8080` |

Luego abre: **http://localhost:8080** (inicio) o **http://localhost:8080/tienda** (tienda).

### Pendientes para producción al 100%

Ver **[PENDIENTES-100.md](./PENDIENTES-100.md)** (API en la nube, CORS, compra por WhatsApp, contenido, SEO, etc.).
