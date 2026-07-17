/**
 * Rutas de autenticación (registro, login, Google, me, logout, refresh).
 * Base: /api/auth
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { ensureGoogleAuthSchema } = require('../lib/ensureGoogleAuth');
const { ensurePasswordResetSchema } = require('../lib/ensurePasswordReset');
const { sendMail, isMailConfigured } = require('../lib/mailer');

ensureGoogleAuthSchema();
ensurePasswordResetSchema();

const ACCESS_EXPIRY = '1h';
const REFRESH_EXPIRY = '7d';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim();
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
const RESET_TOKEN_HOURS = 1;
const SITE_URL = String(process.env.SITE_URL || 'https://www.elxolitomex.com').replace(/\/$/, '');

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compareSync(password, hash);
}

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    nombre_completo: row.nombre_completo || '',
    telefono: row.telefono || '',
    rol: row.rol || 'cliente',
    auth_provider: row.auth_provider || 'local'
  };
}

function issueTokens(user) {
  const payload = { userId: user.id, email: user.email, rol: user.rol || 'cliente' };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY
  });
  return { accessToken, refreshToken };
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

function isGoogleOnlyAccount(user) {
  if (!user) return false;
  const provider = String(user.auth_provider || 'local').toLowerCase();
  return provider === 'google' && !!user.google_id;
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
    const existing = db.prepare('SELECT id, google_id, auth_provider FROM usuarios WHERE email = ?').get(emailNorm);
    if (existing) {
      if (isGoogleOnlyAccount(existing)) {
        return res.status(409).json({
          success: false,
          message: 'Este correo ya está registrado con Google. Usa Continuar con Google.'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese correo'
      });
    }
    const password_hash = hashPassword(password);
    const result = db
      .prepare(
        `INSERT INTO usuarios (email, password_hash, nombre_completo, telefono, auth_provider)
         VALUES (?, ?, ?, ?, 'local')`
      )
      .run(emailNorm, password_hash, nombreTrim, (telefono || '').trim() || null);
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
    const tokens = issueTokens(user);
    return res.status(201).json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens
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
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos'
      });
    }
    if (isGoogleOnlyAccount(user)) {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta usa Google. Pulsa Continuar con Google.'
      });
    }
    if (!comparePassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        message: 'Correo o contraseña incorrectos'
      });
    }
    const tokens = issueTokens(user);
    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens
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

/**
 * POST /api/auth/google
 * Body: { credential: "<Google ID token JWT>" }
 * Crea o vincula usuario y devuelve tokens propios de la API.
 */
router.post('/google', async (req, res) => {
  try {
    if (!GOOGLE_CLIENT_ID || !googleClient) {
      return res.status(503).json({
        success: false,
        message: 'Login con Google no está configurado en el servidor (GOOGLE_CLIENT_ID).'
      });
    }

    const credential = String(req.body?.credential || '').trim();
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Falta el token de Google (credential)'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: 'Token de Google inválido'
      });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({
        success: false,
        message: 'El correo de Google no está verificado'
      });
    }

    const googleId = String(payload.sub);
    const emailNorm = String(payload.email).trim().toLowerCase();
    const nombre =
      String(payload.name || '').trim() ||
      String(payload.given_name || '').trim() ||
      emailNorm.split('@')[0];

    let user = db.prepare('SELECT * FROM usuarios WHERE google_id = ?').get(googleId);

    if (!user) {
      user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(emailNorm);
      if (user) {
        db.prepare(
          `UPDATE usuarios
           SET google_id = ?,
               nombre_completo = COALESCE(NULLIF(TRIM(nombre_completo), ''), ?)
           WHERE id = ?`
        ).run(googleId, nombre, user.id);
        user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(user.id);
      } else {
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const password_hash = hashPassword(randomPassword);
        const result = db
          .prepare(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, google_id, auth_provider)
             VALUES (?, ?, ?, ?, 'google')`
          )
          .run(emailNorm, password_hash, nombre, googleId);
        user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid);
      }
    }

    const tokens = issueTokens(user);
    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens
      }
    });
  } catch (err) {
    console.error('Error POST /api/auth/google:', err);
    const msg = String(err?.message || '');
    if (/Wrong recipient|audience|Token used too late|Invalid token/i.test(msg)) {
      return res.status(401).json({
        success: false,
        message: 'Token de Google inválido o expirado'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión con Google'
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
    const user = db.prepare('SELECT rol FROM usuarios WHERE id = ?').get(payload.userId);
    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      rol: user?.rol || payload.rol || 'cliente'
    };
    const accessToken = jwt.sign(newPayload, JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
    return res.json({
      success: true,
      data: { accessToken }
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Siempre responde éxito genérico (no revela si el correo existe).
 */
router.post('/forgot-password', async (req, res) => {
  const genericMessage =
    'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja y spam.';

  try {
    if (!isMailConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          'El envío de correo aún no está configurado. Contacta a soporte o usa WhatsApp mientras tanto.'
      });
    }

    const emailNorm = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    if (!emailNorm || !emailNorm.includes('@')) {
      return res.status(400).json({ success: false, message: 'Ingresa un correo válido' });
    }

    const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(emailNorm);

    if (user && !isGoogleOnlyAccount(user)) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_HOURS * 60 * 60 * 1000).toISOString();

      db.prepare('DELETE FROM password_reset_tokens WHERE usuario_id = ?').run(user.id);
      db.prepare(
        `INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at)
         VALUES (?, ?, ?)`
      ).run(user.id, tokenHash, expiresAt);

      const resetUrl = `${SITE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
      const nombre = user.nombre_completo || 'hola';

      await sendMail({
        to: emailNorm,
        subject: 'Restablecer contraseña — El Xolito Mex',
        text: `Hola ${nombre},\n\nRecibimos una solicitud para restablecer tu contraseña.\n\nAbre este enlace (válido ${RESET_TOKEN_HOURS} hora(s)):\n${resetUrl}\n\nSi no fuiste tú, ignora este correo.\n\n— El Xolito Mex`,
        html: `
          <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#151515;">
            <h2 style="font-weight:500;">Restablecer contraseña</h2>
            <p>Hola ${nombre},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña en <strong>El Xolito Mex</strong>.</p>
            <p style="margin:28px 0;">
              <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#151515;color:#fff;text-decoration:none;border-radius:4px;">
                Elegir nueva contraseña
              </a>
            </p>
            <p style="font-size:14px;color:#666;">El enlace caduca en ${RESET_TOKEN_HOURS} hora(s). Si no pediste este cambio, ignora este correo.</p>
            <p style="font-size:13px;color:#999;word-break:break-all;">${resetUrl}</p>
          </div>
        `
      });
    }

    return res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error('Error POST /api/auth/forgot-password:', err);
    if (err.code === 'SMTP_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        message: 'El envío de correo aún no está configurado.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'No se pudo enviar el correo. Intenta más tarde.'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
router.post('/reset-password', (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    const password = String(req.body?.password || '');
    if (!token) {
      return res.status(400).json({ success: false, message: 'Falta el token de restablecimiento' });
    }
    const pwdErr = validatePasswordStrength(password);
    if (pwdErr) {
      return res.status(400).json({ success: false, message: pwdErr });
    }

    const tokenHash = hashResetToken(token);
    const row = db
      .prepare(
        `SELECT t.*, u.email, u.auth_provider, u.google_id
         FROM password_reset_tokens t
         JOIN usuarios u ON u.id = t.usuario_id
         WHERE t.token_hash = ?`
      )
      .get(tokenHash);

    if (!row || row.used_at) {
      return res.status(400).json({
        success: false,
        message: 'El enlace no es válido o ya fue usado. Solicita uno nuevo.'
      });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'El enlace expiró. Solicita uno nuevo desde «Olvidaste tu contraseña».'
      });
    }

    const password_hash = hashPassword(password);
    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE usuarios
         SET password_hash = ?, auth_provider = 'local'
         WHERE id = ?`
      ).run(password_hash, row.usuario_id);
      db.prepare(
        `UPDATE password_reset_tokens
         SET used_at = datetime('now', 'localtime')
         WHERE id = ?`
      ).run(row.id);
      db.prepare('DELETE FROM password_reset_tokens WHERE usuario_id = ? AND id != ?').run(
        row.usuario_id,
        row.id
      );
    });
    tx();

    return res.json({
      success: true,
      message: 'Contraseña actualizada. Ya puedes iniciar sesión.'
    });
  } catch (err) {
    console.error('Error POST /api/auth/reset-password:', err);
    return res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña'
    });
  }
});

module.exports = router;
