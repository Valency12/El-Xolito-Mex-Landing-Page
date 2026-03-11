/**
 * Inicializa la base de datos: borra el archivo existente (si existe) y ejecuta schema.sql.
 * Uso: node scripts/init-db.js   o   npm run db:init
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const projectRoot = path.join(__dirname, '..', '..');
const dbPath = path.join(projectRoot, 'database', 'el_xolito_mex.db');
const schemaPath = path.join(projectRoot, 'database', 'schema.sql');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Base de datos anterior eliminada.');
}

const sql = fs.readFileSync(schemaPath, 'utf8');
const db = new Database(dbPath);
db.exec(sql);
db.close();
console.log('Base de datos creada correctamente en database/el_xolito_mex.db');
console.log('Ejecuta: npm start (en backend/) para levantar la API.');
