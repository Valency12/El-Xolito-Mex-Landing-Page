const { slugify } = require('./slug');

function mapProduct(row) {
  if (!row) return null;
  const categoriaSlug = slugify(row.categoria || '');
  const slug = slugify(row.nombre) || 'producto-' + row.id;
  return {
    id: row.id,
    nombre: row.nombre,
    slug: slug,
    descripcion_corta: row.descripcion || '',
    descripcion_larga: row.descripcion || '',
    precio: row.precio,
    precio_anterior: null,
    material: row.material || '',
    color: null,
    destacado: row.destacado === 1,
    stock: row.stock,
    categoria_nombre: row.categoria || '',
    categoria_slug: categoriaSlug,
    imagen_path: row.imagen_path,
    imagenes: row.imagen_path
      ? [{ ruta: row.imagen_path, es_principal: true }]
      : [],
    image: row.imagen_path || '',
    activo: row.activo === 1
  };
}

module.exports = { mapProduct };
