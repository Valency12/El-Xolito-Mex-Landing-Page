/**
 * CRUD de productos para administradores.
 * Base: /api/admin/products
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { mapProduct } = require('../../lib/mapProduct');
const { requireAdmin } = require('../../middleware/requireAdmin');

router.use(requireAdmin);

const CANONICAL_CATEGORIES = [
  'Anillos', 'Brazaletes', 'Collares', 'Aretes',
  'Broqueles', 'Pulseras', 'Dijes', 'Conjuntos'
];

function validateCategory(categoria) {
  if (!categoria) return 'La categoría es obligatoria';
  const match = CANONICAL_CATEGORIES.find(
    (c) => c.toLowerCase() === String(categoria).trim().toLowerCase()
  );
  if (!match) {
    return `Categoría inválida. Usa: ${CANONICAL_CATEGORIES.join(', ')}`;
  }
  return null;
}

function parseProductBody(body, partial = false) {
  const errors = [];
  const data = {};

  if (!partial || body.nombre !== undefined) {
    const nombre = String(body.nombre || '').trim();
    if (!nombre) errors.push('El nombre es obligatorio');
    else data.nombre = nombre;
  }

  if (!partial || body.precio !== undefined) {
    const precio = parseFloat(body.precio);
    if (Number.isNaN(precio) || precio < 0) errors.push('Precio inválido');
    else data.precio = precio;
  }

  if (body.precio_anterior !== undefined && body.precio_anterior !== '' && body.precio_anterior != null) {
    const pa = parseFloat(body.precio_anterior);
    if (Number.isNaN(pa) || pa < 0) errors.push('Precio anterior inválido');
    else data.precio_anterior = pa;
  } else if (!partial || body.precio_anterior !== undefined) {
    data.precio_anterior = null;
  }

  if (!partial || body.categoria !== undefined) {
    const catErr = validateCategory(body.categoria);
    if (catErr) errors.push(catErr);
    else {
      data.categoria = CANONICAL_CATEGORIES.find(
        (c) => c.toLowerCase() === String(body.categoria).trim().toLowerCase()
      );
    }
  }

  if (body.descripcion !== undefined) data.descripcion = String(body.descripcion || '').trim() || null;
  if (body.material !== undefined) data.material = String(body.material || '').trim() || null;
  if (body.imagen_path !== undefined) data.imagen_path = String(body.imagen_path || '').trim() || null;
  if (body.imagen_blanca !== undefined) data.imagen_blanca = String(body.imagen_blanca || '').trim() || null;

  if (body.stock !== undefined) {
    const stock = parseInt(body.stock, 10);
    if (Number.isNaN(stock) || stock < 0) errors.push('Stock inválido');
    else data.stock = stock;
  }

  if (body.activo !== undefined) data.activo = body.activo === true || body.activo === 1 || body.activo === '1' ? 1 : 0;
  if (body.destacado !== undefined) data.destacado = body.destacado === true || body.destacado === 1 || body.destacado === '1' ? 1 : 0;
  if (body.orden !== undefined) {
    const orden = parseInt(body.orden, 10);
    data.orden = Number.isNaN(orden) ? 0 : orden;
  }

  return { errors, data };
}

// GET /api/admin/products
router.get('/', (req, res) => {
  try {
    const { q, categoria, activo } = req.query;
    let sql = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (q) {
      sql += ' AND (nombre LIKE ? OR descripcion LIKE ? OR material LIKE ?)';
      const term = `%${String(q).trim()}%`;
      params.push(term, term, term);
    }
    if (categoria) {
      sql += ' AND LOWER(TRIM(categoria)) = LOWER(TRIM(?))';
      params.push(categoria.trim());
    }
    if (activo !== undefined) {
      sql += ' AND activo = ?';
      params.push(activo === '1' || activo === 1 ? 1 : 0);
    }

    sql += ' ORDER BY orden ASC, destacado DESC, nombre ASC';
    const rows = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      data: { products: rows.map(mapProduct), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/admin/products:', err);
    return res.status(500).json({ success: false, message: 'Error al listar productos' });
  }
});

// GET /api/admin/products/meta/categories
router.get('/meta/categories', (req, res) => {
  return res.json({
    success: true,
    data: { categories: CANONICAL_CATEGORIES }
  });
});

// GET /api/admin/products/:id
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    return res.json({ success: true, data: { product: mapProduct(row) } });
  } catch (err) {
    console.error('Error GET /api/admin/products/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener producto' });
  }
});

// POST /api/admin/products
router.post('/', (req, res) => {
  try {
    const { errors, data } = parseProductBody(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    const result = db.prepare(`
      INSERT INTO productos (
        nombre, descripcion, precio, precio_anterior, imagen_path, imagen_blanca, material,
        stock, categoria, activo, destacado, orden, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      data.nombre,
      data.descripcion ?? null,
      data.precio,
      data.precio_anterior ?? null,
      data.imagen_path ?? null,
      data.imagen_blanca ?? null,
      data.material ?? null,
      data.stock ?? 0,
      data.categoria,
      data.activo ?? 1,
      data.destacado ?? 0,
      data.orden ?? 0
    );

    const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      success: true,
      data: { product: mapProduct(row) },
      message: 'Producto creado'
    });
  } catch (err) {
    console.error('Error POST /api/admin/products:', err);
    return res.status(500).json({ success: false, message: 'Error al crear producto' });
  }
});

// PATCH /api/admin/products/:id
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const existing = db.prepare('SELECT id FROM productos WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    const { errors, data } = parseProductBody(req.body || {}, true);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    const sets = Object.keys(data).map((k) => `${k} = ?`);
    sets.push("updated_at = datetime('now', 'localtime')");
    const values = [...Object.values(data), id];

    db.prepare(`UPDATE productos SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    return res.json({
      success: true,
      data: { product: mapProduct(row) },
      message: 'Producto actualizado'
    });
  } catch (err) {
    console.error('Error PATCH /api/admin/products/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const result = db.prepare('DELETE FROM productos WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    return res.json({ success: true, message: 'Producto eliminado' });
  } catch (err) {
    console.error('Error DELETE /api/admin/products/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
});

module.exports = router;
