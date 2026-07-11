/**
 * Subida de imágenes para el panel admin.
 * Base: POST /api/admin/upload
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../../middleware/requireAdmin');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', '..', 'landing-page', 'assets', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safe);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error('Formato no permitido. Usa JPG, PNG o WebP.'));
    }
    cb(null, true);
  }
});

router.post('/', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
    }
    const relativePath = `assets/uploads/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      data: {
        path: relativePath,
        filename: req.file.filename,
        size: req.file.size
      },
      message: 'Imagen subida'
    });
  } catch (err) {
    console.error('Error POST /api/admin/upload:', err);
    return res.status(500).json({ success: false, message: 'Error al subir imagen' });
  }
});

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message || 'Error de subida' });
  }
});

module.exports = router;
