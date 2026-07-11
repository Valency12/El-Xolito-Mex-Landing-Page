/**
 * Pedidos para administradores.
 * Base: /api/admin/orders
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { requireAdmin } = require('../../middleware/requireAdmin');

router.use(requireAdmin);

const VALID_STATUS = ['pendiente_pago', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'];

function mapOrderRow(row) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    usuario_email: row.usuario_email || null,
    usuario_nombre: row.usuario_nombre || null,
    total: row.total,
    estado: row.estado,
    direccion_entrega: row.direccion_entrega || null,
    contacto: row.contacto || null,
    created_at: row.created_at,
    items_count: row.items_count != null ? row.items_count : undefined
  };
}

// GET /api/admin/orders
router.get('/', (req, res) => {
  try {
    const { estado, q } = req.query;
    let sql = `
      SELECT p.id, p.usuario_id, p.total, p.estado, p.direccion_entrega, p.contacto, p.created_at,
             u.email AS usuario_email, u.nombre_completo AS usuario_nombre,
             (SELECT COUNT(*) FROM pedido_items pi WHERE pi.pedido_id = p.id) AS items_count
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += ' AND p.estado = ?';
      params.push(String(estado).trim().toLowerCase());
    }
    if (q && String(q).trim()) {
      sql += ' AND (u.email LIKE ? OR u.nombre_completo LIKE ? OR CAST(p.id AS TEXT) LIKE ?)';
      const like = `%${String(q).trim()}%`;
      params.push(like, like, like);
    }

    sql += ' ORDER BY p.created_at DESC, p.id DESC';
    const rows = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      data: { orders: rows.map(mapOrderRow), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/admin/orders:', err);
    return res.status(500).json({ success: false, message: 'Error al listar pedidos' });
  }
});

// GET /api/admin/orders/:id
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const row = db.prepare(`
      SELECT p.*, u.email AS usuario_email, u.nombre_completo AS usuario_nombre
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    const items = db.prepare(`
      SELECT pi.id, pi.producto_id, pi.cantidad, pi.precio_unitario,
             p.nombre, p.imagen_path
      FROM pedido_items pi
      LEFT JOIN productos p ON p.id = pi.producto_id
      WHERE pi.pedido_id = ?
      ORDER BY pi.id
    `).all(id);

    return res.json({
      success: true,
      data: {
        order: {
          ...mapOrderRow(row),
          items: items.map((i) => ({
            id: i.id,
            producto_id: i.producto_id,
            nombre: i.nombre || `Producto #${i.producto_id}`,
            imagen_path: i.imagen_path || null,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
            subtotal: i.cantidad * i.precio_unitario
          }))
        }
      }
    });
  } catch (err) {
    console.error('Error GET /api/admin/orders/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener pedido' });
  }
});

// PATCH /api/admin/orders/:id — actualizar estado
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const existing = db.prepare('SELECT id FROM pedidos WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    const body = req.body || {};
    const updates = {};

    if (body.estado !== undefined) {
      const estado = String(body.estado).trim().toLowerCase();
      if (!VALID_STATUS.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Usa: ${VALID_STATUS.join(', ')}`
        });
      }
      updates.estado = estado;
    }

    if (body.direccion_entrega !== undefined) {
      updates.direccion_entrega = String(body.direccion_entrega || '').trim() || null;
    }
    if (body.contacto !== undefined) {
      updates.contacto = String(body.contacto || '').trim() || null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    const sets = Object.keys(updates).map((k) => `${k} = ?`);
    db.prepare(`UPDATE pedidos SET ${sets.join(', ')} WHERE id = ?`).run(...Object.values(updates), id);

    const row = db.prepare(`
      SELECT p.*, u.email AS usuario_email, u.nombre_completo AS usuario_nombre
      FROM pedidos p
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = ?
    `).get(id);

    return res.json({
      success: true,
      data: { order: mapOrderRow(row) },
      message: 'Pedido actualizado'
    });
  } catch (err) {
    console.error('Error PATCH /api/admin/orders/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar pedido' });
  }
});

module.exports = router;
