function mapVoz(row) {
  if (!row) return null;
  return {
    id: row.id,
    texto: row.texto || '',
    nombre: row.nombre || '',
    lugar: row.lugar || '',
    imagen: row.imagen || '',
    tab_label: row.tab_label || '',
    activo: row.activo === 1,
    orden: row.orden || 0,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

module.exports = { mapVoz };
