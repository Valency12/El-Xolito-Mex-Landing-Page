/**
 * Configuración del frontend (subir junto a la landing).
 *
 * En PRODUCCIÓN: define la URL de tu API antes de cargar authService/productService.
 * Opción A — editar estas líneas:
 *   window.__EL_XOLITO_API__ = 'https://api.tudominio.com/api';
 *   window.__EL_XOLITO_SITE_URL__ = 'https://tudominio.com';
 *   window.__EL_XOLITO_WHATSAPP__ = '5214445428475';
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
  // Producción: URL pública del sitio (sin barra final). Usada en enlaces de WhatsApp.
  if (!w.__EL_XOLITO_SITE_URL__) {
    w.__EL_XOLITO_SITE_URL__ = 'https://www.elxolitomex.com/';
  }
  // Número WhatsApp con lada de país, sin + ni espacios (México: 52 + 10 dígitos).
  if (!w.__EL_XOLITO_WHATSAPP__) {
    w.__EL_XOLITO_WHATSAPP__ = '5214445428475';
  }
  w.getElXolitoApiBase = function getElXolitoApiBase() {
    return String(w.__EL_XOLITO_API__ || 'http://localhost:3000/api').replace(/\/$/, '');
  };
})(typeof window !== 'undefined' ? window : globalThis);
