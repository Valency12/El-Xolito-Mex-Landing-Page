/**
 * Checkout y pedidos. Crear orden desde el carrito (requiere auth).
 * Base: /api/orders
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// POST /api/orders — checkout: crea pedido desde el carrito y lo vacía
// Body opcional: direccion_entrega, contacto
router.post('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const { direccion_entrega, contacto } = req.body || {};
    const cartRows = db
      .prepare(
        `SELECT ci.producto_id, ci.cantidad, p.precio, p.nombre, p.stock
         FROM carrito_items ci
         JOIN productos p ON p.id = ci.producto_id
         WHERE ci.usuario_id = ?`
      )
      .all(userId);
    if (cartRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }
    for (const row of cartRows) {
      if (row.cantidad > row.stock) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para "${row.nombre}". Disponible: ${row.stock}`,
          producto_id: row.producto_id
        });
      }
    }
    const total = cartRows.reduce((sum, r) => sum + r.precio * r.cantidad, 0);
    const insertPedido = db.prepare(
      'INSERT INTO pedidos (usuario_id, total, estado, direccion_entrega, contacto) VALUES (?, ?, ?, ?, ?)'
    );
    const insertItem = db.prepare(
      'INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)'
    );
    const deleteCart = db.prepare('DELETE FROM carrito_items WHERE usuario_id = ?');
    let pedidoId;
    const trans = db.transaction(() => {
      const result = insertPedido.run(userId, total, 'pendiente_pago', direccion_entrega || null, contacto || null);
      pedidoId = result.lastInsertRowid;
      for (const r of cartRows) {
        insertItem.run(pedidoId, r.producto_id, r.cantidad, r.precio);
      }
      deleteCart.run(userId);
    });
    trans();
    return res.status(201).json({
      success: true,
      data: {
        pedido_id: pedidoId,
        total,
        estado: 'pendiente_pago',
        message: 'Pedido creado. Procede al pago.'
      }
    });
  } catch (err) {
    console.error('Error POST /api/orders:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al crear pedido'
    });
  }
});

// GET /api/orders — listar pedidos del usuario
router.get('/', (req, res) => {
  try {
    const userId = req.user.userId;
    const pedidos = db
      .prepare(
        'SELECT id, total, estado, direccion_entrega, contacto, created_at FROM pedidos WHERE usuario_id = ? ORDER BY created_at DESC'
      )
      .all(userId);
    const list = pedidos.map((p) => ({
      id: p.id,
      total: p.total,
      estado: p.estado,
      direccion_entrega: p.direccion_entrega,
      contacto: p.contacto,
      created_at: p.created_at
    }));
    return res.json({
      success: true,
      data: {
        orders: list,
        count: list.length
      }
    });
  } catch (err) {
    console.error('Error GET /api/orders:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al listar pedidos'
    });
  }
});

// GET /api/orders/:id — detalle de un pedido (solo del usuario)
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.userId;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?').get(id, userId);
    if (!pedido) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }
    const items = db
      .prepare(
        `SELECT pi.id, pi.producto_id, pi.cantidad, pi.precio_unitario, p.nombre, p.imagen_path
         FROM pedido_items pi
         JOIN productos p ON p.id = pi.producto_id
         WHERE pi.pedido_id = ?
         ORDER BY pi.id`
      )
      .all(pedido.id);
    return res.json({
      success: true,
      data: {
        order: {
          id: pedido.id,
          total: pedido.total,
          estado: pedido.estado,
          direccion_entrega: pedido.direccion_entrega,
          contacto: pedido.contacto,
          created_at: pedido.created_at,
          items: items.map((i) => ({
            producto_id: i.producto_id,
            nombre: i.nombre,
            imagen_path: i.imagen_path,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
            subtotal: i.cantidad * i.precio_unitario
          }))
        }
      }
    });
  } catch (err) {
    console.error('Error GET /api/orders/:id:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener pedido'
    });
  }
});

module.exports = router;
