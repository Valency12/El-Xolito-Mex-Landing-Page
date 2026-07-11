/**
 * CRUD de voces / testimonios para administradores.
 * Base: /api/admin/voices
 */
const express = require('express');
const router = express.Router();
const db = require('../../db');
const { mapVoz } = require('../../lib/mapVoz');
const { requireAdmin } = require('../../middleware/requireAdmin');

router.use(requireAdmin);

function parseVoiceBody(body, partial = false) {
  const errors = [];
  const data = {};

  if (!partial || body.texto !== undefined) {
    const texto = String(body.texto || '').trim();
    if (!texto) errors.push('El texto de la opinión es obligatorio');
    else data.texto = texto;
  }

  if (!partial || body.nombre !== undefined) {
    const nombre = String(body.nombre || '').trim();
    if (!nombre) errors.push('El nombre es obligatorio');
    else data.nombre = nombre;
  }

  if (body.lugar !== undefined) data.lugar = String(body.lugar || '').trim() || null;
  if (body.imagen !== undefined) data.imagen = String(body.imagen || '').trim() || null;
  if (body.tab_label !== undefined) data.tab_label = String(body.tab_label || '').trim() || null;

  if (body.activo !== undefined) {
    data.activo = body.activo === true || body.activo === 1 || body.activo === '1' ? 1 : 0;
  }
  if (body.orden !== undefined) {
    const orden = parseInt(body.orden, 10);
    data.orden = Number.isNaN(orden) ? 0 : orden;
  }

  return { errors, data };
}

router.get('/', (req, res) => {
  try {
    const { activo } = req.query;
    let sql = 'SELECT * FROM voces WHERE 1=1';
    const params = [];
    if (activo !== undefined) {
      sql += ' AND activo = ?';
      params.push(activo === '1' || activo === 1 ? 1 : 0);
    }
    sql += ' ORDER BY orden ASC, id ASC';
    const rows = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      data: { voices: rows.map(mapVoz), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/admin/voices:', err);
    return res.status(500).json({ success: false, message: 'Error al listar voces' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const row = db.prepare('SELECT * FROM voces WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Voz no encontrada' });
    }
    return res.json({ success: true, data: { voice: mapVoz(row) } });
  } catch (err) {
    console.error('Error GET /api/admin/voices/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener voz' });
  }
});

router.post('/', (req, res) => {
  try {
    const { errors, data } = parseVoiceBody(req.body || {}, false);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }

    const result = db.prepare(`
      INSERT INTO voces (texto, nombre, lugar, imagen, tab_label, activo, orden, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      data.texto,
      data.nombre,
      data.lugar ?? null,
      data.imagen ?? null,
      data.tab_label ?? null,
      data.activo ?? 1,
      data.orden ?? 0
    );

    const row = db.prepare('SELECT * FROM voces WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      success: true,
      data: { voice: mapVoz(row) },
      message: 'Voz creada'
    });
  } catch (err) {
    console.error('Error POST /api/admin/voices:', err);
    return res.status(500).json({ success: false, message: 'Error al crear voz' });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const existing = db.prepare('SELECT id FROM voces WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Voz no encontrada' });
    }

    const { errors, data } = parseVoiceBody(req.body || {}, true);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join('. ') });
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    const sets = Object.keys(data).map((k) => `${k} = ?`);
    sets.push("updated_at = datetime('now', 'localtime')");
    db.prepare(`UPDATE voces SET ${sets.join(', ')} WHERE id = ?`).run(...Object.values(data), id);

    const row = db.prepare('SELECT * FROM voces WHERE id = ?').get(id);
    return res.json({
      success: true,
      data: { voice: mapVoz(row) },
      message: 'Voz actualizada'
    });
  } catch (err) {
    console.error('Error PATCH /api/admin/voices/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar voz' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const result = db.prepare('DELETE FROM voces WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Voz no encontrada' });
    }
    return res.json({ success: true, message: 'Voz eliminada' });
  } catch (err) {
    console.error('Error DELETE /api/admin/voices/:id:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar voz' });
  }
});

module.exports = router;
