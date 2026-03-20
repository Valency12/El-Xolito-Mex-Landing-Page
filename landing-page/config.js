/**
 * Configuración del frontend (subir junto a la landing).
 *
 * En PRODUCCIÓN: define la URL de tu API antes de cargar authService/productService.
 * Opción A — editar esta línea:
 *   window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';
 * Opción B — en tu HTML, antes de <script src="config.js">:
 *   <script>window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';</script>
 *
 * Debe apuntar a la base que incluye /api (sin barra final).
 */
(function (w) {
  if (typeof w === 'undefined' || !w) return;
  if (!w.__EL_XOLITO_API__) {
    w.__EL_XOLITO_API__ = 'http://localhost:3000/api';
  }
  w.getElXolitoApiBase = function getElXolitoApiBase() {
    return String(w.__EL_XOLITO_API__ || 'http://localhost:3000/api').replace(/\/$/, '');
  };
})(typeof window !== 'undefined' ? window : globalThis);
