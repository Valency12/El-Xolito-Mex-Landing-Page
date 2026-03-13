require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productosRouter = require('./routes/productos');
const categoriasRouter = require('./routes/categorias');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API
app.use('/api/products', productosRouter);
app.use('/api/categories', categoriasRouter);
app.use('/api/auth', authRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'El Xolito Mex API' });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`  Productos:  GET http://localhost:${PORT}/api/products`);
  console.log(`  Categorías: GET http://localhost:${PORT}/api/categories`);
  console.log(`  Auth:       POST http://localhost:${PORT}/api/auth/register | /api/auth/login`);
  console.log(`  Carrito:    GET/POST/PATCH/DELETE http://localhost:${PORT}/api/cart (auth)`);
  console.log(`  Pedidos:    POST/GET http://localhost:${PORT}/api/orders (auth)`);
});
