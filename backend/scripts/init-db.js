/**
 * Inicializa la base de datos: borra el archivo existente (si existe) y ejecuta schema.sql.
 * Usa el binario sqlite3 del sistema (no depende de better-sqlite3).
 * Uso: node scripts/init-db.js   o   npm run db:init
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..', '..');
const dbPath = path.join(projectRoot, 'database', 'el_xolito_mex.db');
const schemaPath = path.join(projectRoot, 'database', 'schema.sql');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Base de datos anterior eliminada.');
}

execSync(`sqlite3 "${dbPath}" < "${schemaPath}"`, {
  cwd: projectRoot,
  stdio: 'inherit'
});
console.log('Base de datos creada correctamente en database/el_xolito_mex.db');
console.log('Ejecuta: npm start (en backend/) para levantar la API.');
