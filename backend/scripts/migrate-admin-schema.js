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
addColumnIfMissing('banners', 'producto_id', 'INTEGER');

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

CREATE TABLE IF NOT EXISTS voces (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    texto       TEXT    NOT NULL,
    nombre      TEXT    NOT NULL,
    lugar       TEXT,
    imagen      TEXT,
    tab_label   TEXT,
    activo      INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    orden       INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT    DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_voces_activo ON voces(activo);
CREATE INDEX IF NOT EXISTS idx_voces_orden ON voces(orden);
`);

const voiceCount = db.prepare('SELECT COUNT(*) AS n FROM voces').get().n;
if (voiceCount === 0) {
  const insertVoice = db.prepare(`
    INSERT INTO voces (texto, nombre, lugar, imagen, tab_label, activo, orden)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);
  insertVoice.run(
    '“Compré un anillo de plata .925 y la calidad es impresionante. La artesanía es impecable y el diseño elegante.”',
    'María González',
    'Ciudad de México',
    'assets/Anillos/ChatGPT Image 8 jul 2026, 05_08_09 p.m..png',
    'María',
    0
  );
  insertVoice.run(
    '“Mi pulsera artesanal es mi pieza favorita. El diseño minimalista combina con todo y la plata se mantiene brillante.”',
    'Ana Rodríguez',
    'Guadalajara',
    'assets/Pulseras/ChatGPT Image 25 may 2026, 11_19_10 p.m..png',
    'Ana',
    1
  );
  insertVoice.run(
    '“El conjunto de aretes y anillo se siente hecho a mano. La calidad justifica la inversión y el servicio fue excelente.”',
    'Carlos Méndez',
    'Monterrey',
    'assets/Anillos/ChatGPT Image 8 jul 2026, 04_37_20 p.m..png',
    'Carlos',
    2
  );
  console.log('  + voces (seed inicial x3)');
}

console.log('Migración completada.');
db.close();
