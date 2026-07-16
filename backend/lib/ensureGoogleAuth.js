/**
 * Asegura columnas para login con Google.
 * Se ejecuta al cargar el módulo de auth (idempotente).
 */
const db = require('../db');

function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function ensureGoogleAuthSchema() {
  if (!columnExists('usuarios', 'google_id')) {
    db.exec('ALTER TABLE usuarios ADD COLUMN google_id TEXT');
    console.log('  + usuarios.google_id');
  }
  if (!columnExists('usuarios', 'auth_provider')) {
    db.exec("ALTER TABLE usuarios ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'");
    console.log('  + usuarios.auth_provider');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id)');
}

module.exports = { ensureGoogleAuthSchema };
