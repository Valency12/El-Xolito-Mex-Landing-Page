const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('./auth');

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    const row = db
      .prepare('SELECT id, email, rol, nombre_completo FROM usuarios WHERE id = ?')
      .get(req.user.userId);
    if (!row || row.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Se requiere cuenta de administrador'
      });
    }
    req.admin = row;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

module.exports = { requireAdmin };
