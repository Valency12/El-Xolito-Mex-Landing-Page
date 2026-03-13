/**
 * Carrito por usuario (backend). Requiere autenticación.
 * Base: /api/cart
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { mapProduct } = require('../lib/mapProduct');

router.use(authenticate);

// GET /api/cart
router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const rows = db
      .prepare(
        `SELECT ci.id, ci.producto_id, ci.cantidad, ci.created_at,
                p.nombre, p.precio, p.imagen_path, p.material, p.stock, p.categoria, p.activo, p.destacado, p.descripcion
         FROM carrito_items ci
         JOIN productos p ON p.id = ci.producto_id
         WHERE ci.usuario_id = ?
         ORDER BY ci.created_at DESC`
      )
      .all(userId);
    const items = rows.map((r) => {
      const product = mapProduct({
        id: r.producto_id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        precio: r.precio,
        imagen_path: r.imagen_path,
        material: r.material,
        stock: r.stock,
        categoria: r.categoria,
        activo: r.activo,
        destacado: r.destacado
      });
      return {
        id: r.id,
        producto_id: r.producto_id,
        cantidad: r.cantidad,
        product,
        subtotal: r.precio * r.cantidad
      };
    });
    const total = items.reduce((sum, it) => sum + it.subtotal, 0);
    return res.json({
      success: true,
      data: { items, total, count: items.length }
    });
  } catch (err) {
    console.error('Error GET /api/cart:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener carrito' });
  }
});

// POST /api/cart/items — body: producto_id, cantidad? (default 1)
router.post('/items', (req, res) => {
  try {
    const userId = req.user.userId;
    const { producto_id, cantidad = 1 } = req.body || {};
    const prodId = parseInt(producto_id, 10);
    if (Number.isNaN(prodId) || prodId < 1) {
      return res.status(400).json({ success: false, message: 'producto_id inválido' });
    }
    const qty = Math.max(1, parseInt(cantidad, 10) || 1);
    const product = db.prepare('SELECT id, precio, stock FROM productos WHERE id = ? AND activo = 1').get(prodId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado o inactivo' });
    }
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: 'No hay stock suficiente',
        stock_disponible: product.stock
      });
    }
    const existing = db.prepare('SELECT id, cantidad FROM carrito_items WHERE usuario_id = ? AND producto_id = ?').get(userId, prodId);
    if (existing) {
      const newQty = existing.cantidad + qty;
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: 'No hay stock suficiente', stock_disponible: product.stock });
      }
      db.prepare('UPDATE carrito_items SET cantidad = cantidad + ? WHERE id = ?').run(qty, existing.id);
    } else {
      db.prepare('INSERT INTO carrito_items (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)').run(userId, prodId, qty);
    }
    return res.status(201).json({ success: true, data: { message: 'Agregado al carrito' } });
  } catch (err) {
    console.error('Error POST /api/cart/items:', err);
    return res.status(500).json({ success: false, message: 'Error al agregar al carrito' });
  }
});

// PATCH /api/cart/items/:producto_id — body: cantidad
router.patch('/items/:producto_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const prodId = parseInt(req.params.producto_id, 10);
    const qty = parseInt(req.body?.cantidad, 10);
    if (Number.isNaN(prodId) || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'producto_id y cantidad (>=1) requeridos' });
    }
    const product = db.prepare('SELECT stock FROM productos WHERE id = ?').get(prodId);
    if (!product || product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: 'Producto no encontrado o cantidad mayor al stock',
        stock_disponible: product ? product.stock : 0
      });
    }
    const result = db.prepare('UPDATE carrito_items SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?').run(qty, userId, prodId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'El producto no está en tu carrito' });
    }
    return res.json({ success: true, data: { message: 'Cantidad actualizada' } });
  } catch (err) {
    console.error('Error PATCH /api/cart/items:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar carrito' });
  }
});

// DELETE /api/cart/items/:producto_id
router.delete('/items/:producto_id', (req, res) => {
  try {
    const userId = req.user.userId;
    const prodId = parseInt(req.params.producto_id, 10);
    if (Number.isNaN(prodId)) {
      return res.status(400).json({ success: false, message: 'producto_id inválido' });
    }
    const result = db.prepare('DELETE FROM carrito_items WHERE usuario_id = ? AND producto_id = ?').run(userId, prodId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'El producto no está en tu carrito' });
    }
    return res.json({ success: true, data: { message: 'Eliminado del carrito' } });
  } catch (err) {
    console.error('Error DELETE /api/cart/items:', err);
    return res.status(500).json({ success: false, message: 'Error al quitar del carrito' });
  }
});

// DELETE /api/cart — vaciar carrito
router.delete('/', (req, res) => {
  try {
    db.prepare('DELETE FROM carrito_items WHERE usuario_id = ?').run(req.user.userId);
    return res.json({ success: true, data: { message: 'Carrito vaciado' } });
  } catch (err) {
    console.error('Error DELETE /api/cart:', err);
    return res.status(500).json({ success: false, message: 'Error al vaciar carrito' });
  }
});

module.exports = router;
