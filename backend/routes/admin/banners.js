/**
 * CRUD de banners / contenido editorial para administradores.
 * Base: /api/admin/banners
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { mapBanner } = require('../../lib/mapBanner');
const { requireAdmin } = require('../../middleware/requireAdmin');

router.use(requireAdmin);

const VALID_TYPES = ['oferta', 'hero', 'portada'];

function parseBannerBody(body, partial = false) {
  const errors = [];
  const data = {};

  if (!partial || body.tipo !== undefined) {
    const tipo = String(body.tipo || 'oferta').trim().toLowerCase();
    if (!VALID_TYPES.includes(tipo)) {
      errors.push(`Tipo inválido. Usa: ${VALID_TYPES.join(', ')}`);
    } else {
      data.tipo = tipo;
    }
  }

  if (!partial || body.imagen_desktop !== undefined) {
    const img = String(body.imagen_desktop || '').trim();
    const productId = body.producto_id != null && body.producto_id !== ''
      ? parseInt(body.producto_id, 10)
      : null;
    if (!img && !productId) errors.push('La imagen principal es obligatoria (o vincula un producto)');
    else if (img) data.imagen_desktop = img;
    else data.imagen_desktop = null;
  }

  if (body.titulo !== undefined) data.titulo = String(body.titulo || '').trim() || null;
  if (body.subtitulo !== undefined) data.subtitulo = String(body.subtitulo || '').trim() || null;
  if (body.imagen_mobile !== undefined) data.imagen_mobile = String(body.imagen_mobile || '').trim() || null;
  if (body.enlace !== undefined) data.enlace = String(body.enlace || '').trim() || null;
  if (body.texto_boton !== undefined) data.texto_boton = String(body.texto_boton || '').trim() || null;
  if (body.etiqueta !== undefined) data.etiqueta = String(body.etiqueta || '').trim() || null;
  if (body.fecha_inicio !== undefined) data.fecha_inicio = body.fecha_inicio || null;
  if (body.fecha_fin !== undefined) data.fecha_fin = body.fecha_fin || null;

  if (body.producto_id !== undefined) {
    if (body.producto_id === null || body.producto_id === '') data.producto_id = null;
    else {
      const pid = parseInt(body.producto_id, 10);
      data.producto_id = Number.isNaN(pid) ? null : pid;
    }
  }

  if (body.precio_anterior !== undefined) {
    if (body.precio_anterior === null || body.precio_anterior === '') data.precio_anterior = null;
    else {
      const n = Number(body.precio_anterior);
      data.precio_anterior = Number.isFinite(n) ? n : null;
    }
  }
  if (body.precio_nuevo !== undefined) {
    if (body.precio_nuevo === null || body.precio_nuevo === '') data.precio_nuevo = null;
    else {
      const n = Number(body.precio_nuevo);
      data.precio_nuevo = Number.isFinite(n) ? n : null;
    }
  }

  if (body.activo !== undefined) {
    data.activo = body.activo === true || body.activo === 1 || body.activo === '1' ? 1 : 0;
  }
  if (body.orden !== undefined) {
    const orden = parseInt(body.orden, 10);
    data.orden = Number.isNaN(orden) ? 0 : orden;
  }

  return { errors, data };
}

// GET /api/admin/banners
router.get('/', (req, res) => {
  try {
    const { tipo, activo } = req.query;
    let sql = 'SELECT * FROM banners WHERE 1=1';
    const params = [];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(String(tipo).trim().toLowerCase());
    }
    if (activo !== undefined) {
      sql += ' AND activo = ?';
      params.push(activo === '1' || activo === 1 ? 1 : 0);
    }

    sql += ' ORDER BY orden ASC, id DESC';
    const rows = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      data: { banners: rows.map(mapBanner), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/admin/banners:', err);
    return res.status(500).json({ success: false, message: 'Error al listar banners' });
  }
});

// GET /api/admin/banners/:id
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const row = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Banner no encontrado' });
    }
    return res.json({ success: true, data: { banner: mapBanner(row) } });
  } catch (err) {
    console.error('Error GET /api/admin/banners/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener banner' });
  }
});

// POST /api/admin/banners
router.post('/', (req, res) => {
  try {
    const { errors, data } = parseBannerBody(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    if (data.producto_id && !data.imagen_desktop) {
      const prod = db.prepare('SELECT imagen_path, nombre, precio, precio_anterior FROM productos WHERE id = ?').get(data.producto_id);
      if (!prod) {
        return res.status(400).json({ success: false, message: 'Producto vinculado no encontrado' });
      }
      data.imagen_desktop = prod.imagen_path || 'assets/Anillos/anillo.png';
      if (data.titulo == null) data.titulo = prod.nombre;
      if (data.precio_nuevo == null) data.precio_nuevo = prod.precio;
      if (data.precio_anterior == null) data.precio_anterior = prod.precio_anterior;
      if (data.enlace == null) data.enlace = `producto?id=${data.producto_id}`;
    }

    if (!data.imagen_desktop) {
      return res.status(400).json({ success: false, message: 'La imagen principal es obligatoria' });
    }

    const result = db.prepare(`
      INSERT INTO banners (
        tipo, titulo, subtitulo, imagen_desktop, imagen_mobile, enlace,
        texto_boton, etiqueta, precio_anterior, precio_nuevo, producto_id,
        activo, orden, fecha_inicio, fecha_fin, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      data.tipo || 'oferta',
      data.titulo ?? null,
      data.subtitulo ?? null,
      data.imagen_desktop,
      data.imagen_mobile ?? null,
      data.enlace ?? null,
      data.texto_boton ?? null,
      data.etiqueta ?? null,
      data.precio_anterior ?? null,
      data.precio_nuevo ?? null,
      data.producto_id ?? null,
      data.activo ?? 1,
      data.orden ?? 0,
      data.fecha_inicio ?? null,
      data.fecha_fin ?? null
    );

    const row = db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      success: true,
      data: { banner: mapBanner(row) },
      message: 'Banner creado'
    });
  } catch (err) {
    console.error('Error POST /api/admin/banners:', err);
    return res.status(500).json({ success: false, message: 'Error al crear banner' });
  }
});

// PATCH /api/admin/banners/:id
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const existing = db.prepare('SELECT id FROM banners WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Banner no encontrado' });
    }

    const { errors, data } = parseBannerBody(req.body || {}, true);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    if (data.producto_id && (data.imagen_desktop === null || data.imagen_desktop === undefined)) {
      const prod = db.prepare('SELECT imagen_path FROM productos WHERE id = ?').get(data.producto_id);
      if (prod?.imagen_path) data.imagen_desktop = prod.imagen_path;
    }

    const sets = Object.keys(data).map((k) => `${k} = ?`);
    sets.push("updated_at = datetime('now', 'localtime')");
    const values = [...Object.values(data), id];

    db.prepare(`UPDATE banners SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    return res.json({
      success: true,
      data: { banner: mapBanner(row) },
      message: 'Banner actualizado'
    });
  } catch (err) {
    console.error('Error PATCH /api/admin/banners/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar banner' });
  }
});

// DELETE /api/admin/banners/:id
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const result = db.prepare('DELETE FROM banners WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Banner no encontrado' });
    }
    return res.json({ success: true, message: 'Banner eliminado' });
  } catch (err) {
    console.error('Error DELETE /api/admin/banners/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar banner' });
  }
});

module.exports = router;
