/**
 * Rutas de categorías (lista canónica: Anillos, Brazaletes, Collares, Aretes, Broqueles, Pulseras, Dijes, Conjuntos).
 * Base: /api/categories
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories — listar categorías canónicas con cantidad de productos activos
router.get('/', (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT c.id, c.nombre, c.slug, c.orden,
                (SELECT COUNT(*) FROM productos p WHERE p.activo = 1 AND TRIM(COALESCE(p.categoria, '')) = c.nombre) AS total
         FROM categorias c
         ORDER BY c.orden ASC, c.nombre ASC`
      )
      .all();
    const categories = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      slug: r.slug,
      orden: r.orden != null ? r.orden : r.id,
      total: r.total || 0
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
    const cat = db.prepare('SELECT id, nombre, slug, orden FROM categorias WHERE slug = ?').get(slug);
    if (!cat) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    const totalRow = db
      .prepare(
        'SELECT COUNT(*) AS n FROM productos WHERE activo = 1 AND TRIM(COALESCE(categoria, "")) = ?'
      )
      .get(cat.nombre);
    return res.json({
      success: true,
      data: {
        category: {
          id: cat.id,
          nombre: cat.nombre,
          slug: cat.slug,
          total: totalRow ? totalRow.n : 0
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
