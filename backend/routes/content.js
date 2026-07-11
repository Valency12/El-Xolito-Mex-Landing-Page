/**
 * Contenido público del sitio (banners, hero, voces).
 * Base: /api/content
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { mapBanner, enrichBannerWithProduct } = require('../lib/mapBanner');
const { mapProduct } = require('../lib/mapProduct');
const { mapVoz } = require('../lib/mapVoz');

function getProductById(id) {
  if (id == null) return null;
  const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
  return row ? mapProduct(row) : null;
}

// GET /api/content/banners?tipo=oferta
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
    const banners = rows
      .map((row) => {
        const base = mapBanner(row);
        if (!base.producto_id) return base;
        const product = getProductById(base.producto_id);
        // No mostrar oferta de producto inactivo o sin stock
        if (!product || !product.activo || !(product.stock > 0)) return null;
        return enrichBannerWithProduct(base, product);
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data: { banners, count: banners.length }
    });
  } catch (err) {
    console.error('Error GET /api/content/banners:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener contenido' });
  }
});

// GET /api/content/voices
router.get('/voices', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM voces
      WHERE activo = 1
      ORDER BY orden ASC, id ASC
    `).all();
    return res.json({
      success: true,
      data: { voices: rows.map(mapVoz), count: rows.length }
    });
  } catch (err) {
    console.error('Error GET /api/content/voices:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener voces' });
  }
});

// GET /api/content/deals — ofertas listas para la landing (banners o productos en descuento)
router.get('/deals', (req, res) => {
  try {
    const bannerRows = db.prepare(`
      SELECT * FROM banners
      WHERE activo = 1 AND tipo = 'oferta'
        AND (fecha_inicio IS NULL OR fecha_inicio <= datetime('now', 'localtime'))
        AND (fecha_fin IS NULL OR fecha_fin >= datetime('now', 'localtime'))
      ORDER BY orden ASC, id DESC
      LIMIT 6
    `).all();

    let deals = bannerRows
      .map((row) => {
        const base = mapBanner(row);
        if (base.producto_id) {
          const product = getProductById(base.producto_id);
          if (!product || !product.activo || !(product.stock > 0)) return null;
          return enrichBannerWithProduct(base, product);
        }
        // Banner manual: exige imagen; precios opcionales
        if (!base.imagen_desktop) return null;
        return base;
      })
      .filter(Boolean)
      .slice(0, 3);

    if (!deals.length) {
      const saleRows = db.prepare(`
        SELECT * FROM productos
        WHERE activo = 1
          AND stock > 0
          AND precio_anterior IS NOT NULL
          AND precio_anterior > precio
        ORDER BY destacado DESC, orden ASC, id DESC
        LIMIT 3
      `).all();

      deals = saleRows.map((row) => {
        const product = mapProduct(row);
        return enrichBannerWithProduct({
          id: `product-${product.id}`,
          tipo: 'oferta',
          titulo: '',
          subtitulo: '',
          imagen_desktop: '',
          imagen_mobile: '',
          enlace: '',
          texto_boton: 'Ver oferta',
          etiqueta: '',
          precio_anterior: null,
          precio_nuevo: null,
          producto_id: product.id,
          activo: true,
          orden: product.orden || 0
        }, product);
      });
    }

    return res.json({
      success: true,
      data: { deals, count: deals.length }
    });
  } catch (err) {
    console.error('Error GET /api/content/deals:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener ofertas' });
  }
});

module.exports = router;
