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
- Para la tienda: **http://localhost:8080/tienda.html**.

**Importante:** el frontend llama a la API en `http://localhost:3000`. Si no levantas el backend, la tienda usará productos de ejemplo.

### Resumen rápido

| Terminal 1 (backend) | Terminal 2 (frontend) |
|---------------------|------------------------|
| `cd backend && npm install && npm run db:init && npm start` | `cd landing-page && npx serve -l 8080` |

Luego abre: **http://localhost:8080** (inicio) o **http://localhost:8080/tienda.html** (tienda).
