require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const productosRouter = require('./routes/productos');
const categoriasRouter = require('./routes/categorias');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const contentRouter = require('./routes/content');
const adminProductsRouter = require('./routes/admin/products');
const adminBannersRouter = require('./routes/admin/banners');
const adminUploadRouter = require('./routes/admin/upload');
const adminOrdersRouter = require('./routes/admin/orders');
const adminVoicesRouter = require('./routes/admin/voices');

const app = express();
const PORT = process.env.PORT || 3000;

// Producción: CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com
const corsOrigins = process.env.CORS_ORIGINS;
const corsOptions = corsOrigins
  ? {
      origin: corsOrigins.split(',').map((s) => s.trim()).filter(Boolean),
      credentials: true
    }
  : { origin: true, credentials: true };
app.use(cors(corsOptions));
app.use(express.json());

// Imágenes subidas desde el admin (Render) — públicas en /uploads/*
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
// Compatibilidad: subidas viejas guardadas en landing-page/assets/uploads
const legacyUploadsDir = path.join(__dirname, '..', 'landing-page', 'assets', 'uploads');
if (fs.existsSync(legacyUploadsDir)) {
  app.use('/uploads', express.static(legacyUploadsDir, { maxAge: '7d' }));
}

// API
app.use('/api/products', productosRouter);
app.use('/api/categories', categoriasRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/content', contentRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/banners', adminBannersRouter);
app.use('/api/admin/upload', adminUploadRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/voices', adminVoicesRouter);

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'El Xolito Mex API' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`  Productos:  GET http://localhost:${PORT}/api/products`);
  console.log(`  Categorías: GET http://localhost:${PORT}/api/categories`);
  console.log(`  Auth:       POST http://localhost:${PORT}/api/auth/register | /login | /google`);
  console.log(`  Carrito:    GET/POST/PATCH/DELETE http://localhost:${PORT}/api/cart (auth)`);
  console.log(`  Pedidos:    POST/GET http://localhost:${PORT}/api/orders (auth)`);
  console.log(`  Contenido:  GET http://localhost:${PORT}/api/content/banners | /voices`);
  console.log(`  Uploads:    GET http://localhost:${PORT}/uploads/<archivo>`);
  console.log(`  Admin:      /api/admin/products | /api/admin/banners | /api/admin/voices | /api/admin/orders | /api/admin/upload`);
});
