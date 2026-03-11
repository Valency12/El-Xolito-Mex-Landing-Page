/**
 * Rutas de categorías (derivadas de los productos).
 * Base: /api/categories
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { slugify } = require('../lib/slug');

// GET /api/categories — listar categorías únicas con slug y cantidad
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT categoria, COUNT(*) as total FROM productos WHERE activo = 1 AND TRIM(COALESCE(categoria, '')) != '' GROUP BY TRIM(categoria) ORDER BY categoria ASC`
      )
      .all();
    const categories = rows.map((r) => ({
      id: slugify(r.categoria),
      nombre: r.categoria.trim(),
      slug: slugify(r.categoria),
      total: r.total
    }));
    return res.json({
      success: true,
      data: {
        categories,
        count: categories.length
      }
    });
  } catch (err) {
    console.error('Error GET /api/categories:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
});

// GET /api/categories/:slug — una categoría por slug
router.get('/:slug', (req, res) => {
  try {
    const slug = (req.params.slug || '').trim().toLowerCase();
    const rows = db.prepare('SELECT DISTINCT categoria FROM productos WHERE activo = 1').all();
    const cat = rows.find((r) => slugify((r.categoria || '').trim()) === slug);
    if (!cat) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    const total = db
      .prepare('SELECT COUNT(*) as n FROM productos WHERE activo = 1 AND TRIM(COALESCE(categoria, "")) = ?')
      .get(cat.categoria.trim());
    return res.json({
      success: true,
      data: {
        category: {
          id: slug,
          nombre: cat.categoria.trim(),
          slug: slug,
          total: total ? total.n : 0
        }
      }
    });
  } catch (err) {
    console.error('Error GET /api/categories/:slug:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categoría'
    });
  }
});

module.exports = router;
