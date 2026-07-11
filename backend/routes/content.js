/**
 * Contenido público del sitio (banners, hero).
 * Base: /api/content
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { mapBanner } = require('../lib/mapBanner');

// GET /api/content/banners?tipo=oferta&activo=1
router.get('/banners', (req, res) => {
  try {
    const { tipo } = req.query;
    let sql = `SELECT * FROM banners WHERE activo = 1`;
    const params = [];

    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(String(tipo).trim().toLowerCase());
    }

    sql += ` AND (fecha_inicio IS NULL OR fecha_inicio <= datetime('now', 'localtime'))
             AND (fecha_fin IS NULL OR fecha_fin >= datetime('now', 'localtime'))`;
    sql += ' ORDER BY orden ASC, id DESC';

    const rows = db.prepare(sql).all(...params);
    return res.json({
      success: true,
      data: { banners: rows.map(mapBanner), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/content/banners:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener contenido' });
  }
});

module.exports = router;
