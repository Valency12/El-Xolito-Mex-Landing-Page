function mapBanner(row) {
  if (!row) return null;
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.titulo || '',
    subtitulo: row.subtitulo || '',
    imagen_desktop: row.imagen_desktop,
    imagen_mobile: row.imagen_mobile || '',
    enlace: row.enlace || '',
    texto_boton: row.texto_boton || '',
    etiqueta: row.etiqueta || '',
    precio_anterior: row.precio_anterior != null ? row.precio_anterior : null,
    precio_nuevo: row.precio_nuevo != null ? row.precio_nuevo : null,
    producto_id: row.producto_id != null ? row.producto_id : null,
    activo: row.activo === 1,
    orden: row.orden || 0,
    fecha_inicio: row.fecha_inicio || null,
    fecha_fin: row.fecha_fin || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

/** Completa una oferta con datos del producto vinculado (imagen/precios reales). */
function enrichBannerWithProduct(banner, product) {
  if (!banner) return null;
  if (!product) return banner;

  const precio = Number(product.precio);
  const precioAnt = product.precio_anterior != null ? Number(product.precio_anterior) : null;
  let etiqueta = banner.etiqueta;
  if (!etiqueta && precioAnt != null && Number.isFinite(precioAnt) && precioAnt > precio) {
    const pct = Math.round((1 - precio / precioAnt) * 100);
    if (pct > 0) etiqueta = `−${pct}%`;
  }

  return {
    ...banner,
    titulo: banner.titulo || product.nombre || '',
    subtitulo: banner.subtitulo || (product.material ? product.material : ''),
    imagen_desktop: banner.imagen_desktop || product.imagen_path || '',
    imagen_mobile: banner.imagen_mobile || '',
    enlace: banner.enlace || `producto?id=${product.id}`,
    texto_boton: banner.texto_boton || 'Ver oferta',
    etiqueta: etiqueta || '',
    precio_anterior: banner.precio_anterior != null ? banner.precio_anterior : precioAnt,
    precio_nuevo: banner.precio_nuevo != null ? banner.precio_nuevo : (Number.isFinite(precio) ? precio : null),
    producto_id: product.id
  };
}

module.exports = { mapBanner, enrichBannerWithProduct };
