/**
 * Tabla de tokens para restablecer contraseña.
 */
const db = require('../db');

function ensurePasswordResetSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id  INTEGER NOT NULL,
      token_hash  TEXT    NOT NULL UNIQUE,
      expires_at  TEXT    NOT NULL,
      used_at     TEXT,
      created_at  TEXT    DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_password_reset_usuario ON password_reset_tokens(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);
  `);
}

module.exports = { ensurePasswordResetSchema };
