# Backend – El Xolito Mex (API tienda de joyería)

API en Node.js + Express + SQLite para la tienda virtual ligada a la landing. Sirve catálogo de productos, categorías y autenticación de usuarios.

---

## Flujo de lógica (joyería)

1. **Catálogo**  
   Los productos viven en la tabla `productos` (nombre, descripción, precio, imagen_path, material, stock, categoría, activo, destacado). La tienda y la landing consumen estos datos vía API.

2. **Usuarios**  
   Los clientes que se registran o inician sesión se guardan en `usuarios` (email, contraseña hasheada, nombre, teléfono). El login devuelve JWT (access + refresh) para llamadas autenticadas.

3. **Próximos pasos (sin implementar aún)**  
   - Carrito: puede ser solo en el front (localStorage) o persistirse en backend.  
   - Pedidos: tabla `pedidos` + `pedido_items` cuando definan checkout.  
   - Cuando te pasen la lista de inventario (Excel/tabla), se importa a `productos` y las imágenes se suben a la carpeta de assets; la API ya devuelve lo que haya en la BD.

Resumen: **primero backend (API + BD) → luego frontend de tienda consume la API → después se cargan datos reales de inventario.**

---

## Requisitos

- Node.js 18+
- SQLite3 instalado en el sistema (para `npm run db:init`)
- En Linux, para compilar `better-sqlite3`: `build-essential` (p. ej. `sudo apt install build-essential`)

---

## Procedimiento (orden recomendado)

### 1. Instalar dependencias

Desde la carpeta `backend/`:

```bash
cd backend
npm install
```

Si falla la compilación de `better-sqlite3`, en Linux instala herramientas de compilación y vuelve a intentar:

```bash
sudo apt install build-essential
npm install
```

### 2. Inicializar la base de datos

Crea (o recrea) la BD con tablas y datos de ejemplo:

```bash
npm run db:init
```

- Borra `database/el_xolito_mex.db` si existe.
- Ejecuta `database/schema.sql` (tablas `productos` y `usuarios` + INSERTs de ejemplo).

Así puedes probar que los datos de la BD se reflejan en la API.

### 3. Variables de entorno (opcional)

Copia `.env.example` a `.env` y ajusta si quieres:

```bash
cp .env.example .env
```

- `PORT`: puerto del servidor (por defecto 3000).
- `JWT_SECRET` y `JWT_REFRESH_SECRET`: claves para los tokens (cambiar en producción).

### 4. Arrancar el servidor

```bash
npm start
```

Deberías ver algo como:

- Servidor escuchando en http://localhost:3000  
- Productos: GET http://localhost:3000/api/products  
- Categorías: GET http://localhost:3000/api/categories  
- Auth: POST http://localhost:3000/api/auth/register | /api/auth/login  

### 5. Probar que los datos se reflejan

- En el navegador o con `curl`:
  - `http://localhost:3000/api/health`
  - `http://localhost:3000/api/products`
  - `http://localhost:3000/api/categories`
- La landing/tienda (frontend) debe apuntar a `http://localhost:3000/api`; si el servidor está en marcha, los productos y categorías que ves vienen de la BD.

---

## Estructura del proyecto backend

```
backend/
├── server.js           # Entrada; monta rutas y CORS
├── db.js               # Conexión a database/el_xolito_mex.db (better-sqlite3)
├── .env.example
├── package.json
├── middleware/
│   └── auth.js         # Verificación de JWT (Bearer)
├── routes/
│   ├── productos.js    # GET /api/products, /api/products/:id, /api/products/category/:slug
│   ├── categorias.js   # GET /api/categories, /api/categories/:slug
│   └── auth.js         # POST register, login, logout; GET me; POST refresh
├── lib/
│   ├── slug.js         # slugify para categorías y productos
│   └── mapProduct.js   # Fila BD → formato esperado por el frontend
└── scripts/
    └── init-db.js      # Ejecuta schema.sql con sqlite3 del sistema (npm run db:init)
```

La BD está en la raíz del repo: `database/el_xolito_mex.db` y `database/schema.sql`.

---

## Endpoints que espera el frontend

- **Productos:**  
  `GET /api/products` (query: `categoria`, `destacado`, `activo`)  
  `GET /api/products/:id`  
  `GET /api/products/category/:slug`  

- **Categorías:**  
  `GET /api/categories`  
  `GET /api/categories/:slug`  

- **Auth:**  
  `POST /api/auth/register` (body: email, password, nombre_completo, telefono)  
  `POST /api/auth/login` (body: email, password)  
  `GET /api/auth/me` (header: Authorization Bearer)  
  `POST /api/auth/logout`  
  `POST /api/auth/refresh` (body: refreshToken)  

---

## Cuando tengas la lista de inventario

Cuando te pasen la tabla/Excel con los productos:

1. Importar los datos a la tabla `productos` (INSERT o script que te generamos a partir del archivo).
2. Subir las imágenes a la carpeta de assets y que `imagen_path` en la BD coincida con la ruta que use el front (p. ej. `assets/Dormilonas/nombre.jpg`).
3. No hace falta tocar el backend ni el frontend si la estructura de la tabla y de la API se mantienen.
