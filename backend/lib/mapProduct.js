const { slugify } = require('./slug');

function mapProduct(row) {
  if (!row) return null;
  const categoriaSlug = slugify(row.categoria || '');
  const slug = slugify(row.nombre) || 'producto-' + row.id;
  const imagenes = [];
  if (row.imagen_path) {
    imagenes.push({ ruta: row.imagen_path, es_principal: true, tipo: 'negro' });
  }
  if (row.imagen_blanca) {
    imagenes.push({ ruta: row.imagen_blanca, es_principal: false, tipo: 'blanco' });
  }
  return {
    id: row.id,
    nombre: row.nombre,
    slug: slug,
    descripcion_corta: row.descripcion || '',
    descripcion_larga: row.descripcion || '',
    precio: row.precio,
    precio_anterior: row.precio_anterior != null ? row.precio_anterior : null,
    material: row.material || '',
    color: null,
    destacado: row.destacado === 1,
    stock: row.stock,
    categoria_nombre: row.categoria || '',
    categoria_slug: categoriaSlug,
    imagen_path: row.imagen_path,
    imagen_blanca: row.imagen_blanca || null,
    imagenes,
    image: row.imagen_path || '',
    image_flip: row.imagen_blanca || null,
    activo: row.activo === 1,
    orden: row.orden != null ? row.orden : 0,
    updated_at: row.updated_at || null
  };
}

module.exports = { mapProduct };
