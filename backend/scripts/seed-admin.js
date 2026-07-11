/**
 * Crea o actualiza el usuario administrador inicial.
 * Uso: node scripts/seed-admin.js
 *
 * Variables opcionales (.env):
 *   ADMIN_EMAIL=admin@elxolitomex.com
 *   ADMIN_PASSWORD=Admin1234!
 *   ADMIN_NOMBRE=Administrador
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database', 'el_xolito_mex.db');
const db = new Database(dbPath);

const email = (process.env.ADMIN_EMAIL || 'admin@elxolitomex.com').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'Admin1234!';
const nombre = process.env.ADMIN_NOMBRE || 'Administrador';

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);

if (existing) {
  db.prepare(
    'UPDATE usuarios SET password_hash = ?, nombre_completo = ?, rol = ? WHERE id = ?'
  ).run(hash, nombre, 'admin', existing.id);
  console.log(`Admin actualizado: ${email}`);
} else {
  db.prepare(
    'INSERT INTO usuarios (email, password_hash, nombre_completo, rol) VALUES (?, ?, ?, ?)'
  ).run(email, hash, nombre, 'admin');
  console.log(`Admin creado: ${email}`);
}

console.log(`Contraseña: ${password}`);
console.log('Panel: http://localhost:8080/admin/ (o el puerto de tu frontend)');
db.close();
