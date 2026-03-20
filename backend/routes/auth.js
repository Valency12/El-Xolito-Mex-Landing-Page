/**
 * Rutas de autenticación (registro, login, me, logout, refresh).
 * Base: /api/auth
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const ACCESS_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    nombre_completo: row.nombre_completo || '',
    telefono: row.telefono || ''
  };
}

/** Misma regla que el cliente: mín. 8 caracteres, mayúscula, minúscula y número */
function validatePasswordStrength(password) {
  if (typeof password !== 'string') {
    return 'La contraseña no es válida';
  }
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return 'La contraseña debe incluir mayúscula, minúscula y un número';
  }
  return null;
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, nombre_completo, telefono } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan email y/o contraseña'
      });
    }
    const nombreTrim = String(nombre_completo || '').trim();
    if (nombreTrim.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Indica tu nombre completo (al menos 2 caracteres)'
      });
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(emailNorm);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese correo'
      });
    }
    const password_hash = hashPassword(password);
    const result = db
      .prepare(
        'INSERT INTO usuarios (email, password_hash, nombre_completo, telefono) VALUES (?, ?, ?, ?)'
      )
      .run(emailNorm, password_hash, nombreTrim, (telefono || '').trim() || null);
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
    const payload = { userId: user.id, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRY
    });
    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Error POST /api/auth/register:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Faltan email y/o contraseña'
      });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(emailNorm);
    if (!user || !comparePassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos'
      });
    }
    const payload = { userId: user.id, email: user.email };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
    const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRY
    });
    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    console.error('Error POST /api/auth/login:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// GET /api/auth/me — usuario actual (requiere token)
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    return res.json({
      success: true,
      data: { user: sanitizeUser(user) }
    });
  } catch (err) {
    console.error('Error GET /api/auth/me:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario'
    });
  }
});

// POST /api/auth/logout — el cliente borra el token; aquí solo confirmamos
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Sesión cerrada' });
});

// POST /api/auth/refresh — nuevo access token con refresh token
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token requerido' });
    }
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    if (payload.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
    const newPayload = { userId: payload.userId, email: payload.email };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
    return res.json({
      success: true,
      data: { accessToken }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

module.exports = router;
