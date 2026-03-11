/**
 * Conexión a la base de datos SQLite (El Xolito Mex).
 * La BD está en /database/el_xolito_mex.db respecto a la raíz del proyecto.
 */
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'el_xolito_mex.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

module.exports = db;
