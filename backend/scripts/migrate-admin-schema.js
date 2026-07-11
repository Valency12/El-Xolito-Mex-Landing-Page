/**
 * Migración incremental para panel admin (columnas nuevas + tabla banners).
 * Seguro de ejecutar varias veces.
 * Uso: node scripts/migrate-admin-schema.js
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database', 'el_xolito_mex.db');
const db = new Database(dbPath);

function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function addColumnIfMissing(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  + ${table}.${column}`);
  }
}

console.log('Migrando esquema admin...');

addColumnIfMissing('usuarios', 'rol', "TEXT NOT NULL DEFAULT 'cliente'");
addColumnIfMissing('productos', 'precio_anterior', 'REAL');
addColumnIfMissing('productos', 'imagen_blanca', 'TEXT');
addColumnIfMissing('productos', 'orden', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('productos', 'updated_at', 'TEXT');

addColumnIfMissing('banners', 'etiqueta', 'TEXT');
addColumnIfMissing('banners', 'precio_anterior', 'REAL');
addColumnIfMissing('banners', 'precio_nuevo', 'REAL');

db.exec(`
CREATE TABLE IF NOT EXISTS banners (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo            TEXT    NOT NULL DEFAULT 'oferta' CHECK (tipo IN ('oferta', 'hero', 'portada')),
    titulo          TEXT,
    subtitulo       TEXT,
    imagen_desktop  TEXT    NOT NULL,
    imagen_mobile   TEXT,
    enlace          TEXT,
    texto_boton     TEXT,
    activo          INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden           INTEGER NOT NULL DEFAULT 0,
    fecha_inicio    TEXT,
    fecha_fin       TEXT,
    created_at      TEXT    DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT    DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_banners_tipo ON banners(tipo);
CREATE INDEX IF NOT EXISTS idx_banners_activo ON banners(activo);
`);

console.log('Migración completada.');
db.close();
