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
    activo: row.activo === 1,
    orden: row.orden || 0,
    fecha_inicio: row.fecha_inicio || null,
    fecha_fin: row.fecha_fin || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = { mapBanner };
