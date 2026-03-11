/**
 * Rutas de productos (catálogo de joyería).
 * Base: /api/products
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { mapProduct } = require('../lib/mapProduct');
const { slugify } = require('../lib/slug');

// GET /api/products — listar productos (filtros: categoria, destacado, activo)
router.get('/', (req, res) => {
  try {
    const { categoria, destacado, activo } = req.query;
    let sql = 'SELECT * FROM productos WHERE 1=1';
    const params = [];

    if (categoria) {
      sql += ' AND LOWER(TRIM(categoria)) = LOWER(TRIM(?))';
      params.push(categoria.trim());
    }
    if (destacado !== undefined && (destacado === '1' || destacado === 1)) {
      sql += ' AND destacado = 1';
    }
    if (activo !== undefined) {
      sql += ' AND activo = ?';
      params.push(activo === '1' || activo === 1 ? 1 : 0);
    }

    sql += ' ORDER BY destacado DESC, nombre ASC';
    const rows = db.prepare(sql).all(...params);
    const products = rows.map(mapProduct);

    return res.json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
  } catch (err) {
    console.error('Error GET /api/products:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos'
    });
  }
});

// GET /api/products/category/:slug — productos por categoría (slug: dormilonas, pulseras, etc.)
router.get('/category/:slug', (req, res) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    if (!slug) {
      return res.json({ success: true, data: { products: [], count: 0 } });
    }
    const all = db.prepare('SELECT * FROM productos WHERE activo = 1').all();
    const products = all
      .filter((r) => slugify((r.categoria || '').trim()) === slug)
      .map(mapProduct);

    return res.json({
      success: true,
      data: {
        products,
        count: products.length
      }
    });
  } catch (err) {
    console.error('Error GET /api/products/category/:slug:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener productos por categoría'
    });
  }
});

// GET /api/products/:id — un producto por ID
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const row = db.prepare('SELECT * FROM productos WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    return res.json({
      success: true,
      data: {
        product: mapProduct(row)
      }
    });
  } catch (err) {
    console.error('Error GET /api/products/:id:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
});

module.exports = router;
