# Backend – El Xolito Mex (API tienda de joyería)

API en Node.js + Express + SQLite para la tienda virtual ligada a la landing. Sirve catálogo de productos, categorías y autenticación de usuarios.

---

## Flujo de lógica (joyería)

1. **Catálogo**  
   Los productos viven en la tabla `productos` (nombre, descripción, precio, imagen_path, material, stock, categoría, activo, destacado). La categoría debe coincidir con la **lista canónica** (tabla `categorias`): **Anillos, Brazaletes, Collares, Aretes, Broqueles, Pulseras, Dijes, Conjuntos.**

2. **Usuarios**  
   Los clientes que se registran o inician sesión se guardan en `usuarios` (email, contraseña hasheada, nombre, teléfono). El login devuelve JWT (access + refresh) para llamadas autenticadas.

3. **Carrito (backend)**  
   Tabla `carrito_items` (usuario_id, producto_id, cantidad). El usuario debe estar autenticado para agregar, ver, actualizar o vaciar el carrito. Endpoints bajo `/api/cart`.

4. **Checkout y pedidos**  
   Tablas `pedidos` (usuario, total, estado, direccion_entrega, contacto) y `pedido_items` (pedido_id, producto_id, cantidad, precio_unitario). `POST /api/orders` crea el pedido desde el carrito actual, vacía el carrito y devuelve `pedido_id` y total (estado inicial: `pendiente_pago`). Luego se puede integrar pasarela de pago.

5. **Próximos pasos**  
   - Integrar API de pago (Stripe, Conekta, Mercado Pago) y actualizar estado del pedido a `pagado` tras el pago.  
   - Cuando te pasen la lista de inventario (Excel/tabla), importar a `productos` con categorías de la lista canónica y subir imágenes a assets.

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
- Ejecuta `database/schema.sql` (tablas `categorias`, `productos`, `usuarios`, `carrito_items`, `pedidos`, `pedido_items` + datos de ejemplo).

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
- Carrito: GET/POST/PATCH/DELETE http://localhost:3000/api/cart (requiere auth)  
- Pedidos: POST/GET http://localhost:3000/api/orders (requiere auth)  

### 5. Probar que los datos se reflejan

- En el navegador o con `curl`:
  - `http://localhost:3000/api/health`
  - `http://localhost:3000/api/products`
  - `http://localhost:3000/api/categories`
- La landing/tienda (frontend) debe apuntar a `http://localhost:3000/api`; si el servidor está en marcha, los productos y categorías que ves vienen de la BD.

### 6. Probar carrito y checkout (script)

Con el servidor en marcha, en otra terminal:

```bash
cd backend
bash scripts/test-api.sh
```

El script hace: health → categorías → productos → registro (o login) → agregar al carrito → ver carrito → crear pedido → listar pedidos. Si algo falla, revisa que el servidor esté en `http://localhost:3000` y que la BD tenga datos (`npm run db:init`).

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
│   ├── categorias.js   # GET /api/categories, /api/categories/:slug (lista canónica)
│   ├── auth.js         # POST register, login, logout; GET me; POST refresh
│   ├── cart.js         # GET/POST/PATCH/DELETE /api/cart (auth)
│   └── orders.js       # POST/GET /api/orders (checkout y listado; auth)
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

- **Carrito (todos requieren header Authorization: Bearer &lt;token&gt;):**  
  `GET /api/cart` — items con producto y subtotal  
  `POST /api/cart/items` (body: producto_id, cantidad?)  
  `PATCH /api/cart/items/:producto_id` (body: cantidad)  
  `DELETE /api/cart/items/:producto_id`  
  `DELETE /api/cart` — vaciar carrito  

- **Pedidos (requieren auth):**  
  `POST /api/orders` (body opcional: direccion_entrega, contacto) — crea pedido desde carrito, vacía carrito; devuelve pedido_id, total, estado  
  `GET /api/orders` — lista de pedidos del usuario  
  `GET /api/orders/:id` — detalle de un pedido con items  

---

## Categorías canónicas

En la BD la tabla `categorias` define la lista oficial. Los productos deben usar exactamente estos nombres en `productos.categoria`:

**Anillos, Brazaletes, Collares, Aretes, Broqueles, Pulseras, Dijes, Conjuntos.**

Slugs en API: `anillos`, `brazaletes`, `collares`, `aretes`, `broqueles`, `pulseras`, `dijes`, `conjuntos`.

---

## Cuando tengas la lista de inventario

Cuando te pasen la tabla/Excel con los productos:

1. Importar los datos a la tabla `productos` (INSERT o script que te generamos a partir del archivo).
2. Usar en `productos.categoria` solo nombres de la lista canónica (Anillos, Brazaletes, Collares, Aretes, Broqueles, Pulseras, Dijes, Conjuntos).
3. Subir las imágenes a la carpeta de assets y que `imagen_path` en la BD coincida con la ruta que use el front (p. ej. `assets/Broqueles/nombre.jpg`).
4. No hace falta tocar el backend ni el frontend si la estructura de la tabla y de la API se mantienen.
