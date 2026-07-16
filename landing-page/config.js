/**
 * Configuración del frontend (subir junto a la landing).
 *
 * En PRODUCCIÓN:
 *   window.__EL_XOLITO_API__ = 'https://elxolito-api.onrender.com/api';
 *   window.__EL_XOLITO_SITE_URL__ = 'https://www.elxolitomex.com';
 *   window.__EL_XOLITO_WHATSAPP__ = '5214445428475';
 *   window.__EL_XOLITO_GOOGLE_CLIENT_ID__ = 'TU_ID.apps.googleusercontent.com';
 *
 * Debe apuntar a la base que incluye /api (sin barra final).
 */
(function (w) {
  if (typeof w === 'undefined' || !w) return;
  if (!w.__EL_XOLITO_API__) {
    w.__EL_XOLITO_API__ = 'https://elxolito-api.onrender.com/api';
  }
  // Producción: URL pública del sitio (sin barra final). Usada en enlaces de WhatsApp.
  if (!w.__EL_XOLITO_SITE_URL__) {
    w.__EL_XOLITO_SITE_URL__ = 'https://www.elxolitomex.com';
  }
  // Número WhatsApp con lada de país, sin + ni espacios (México: 52 + 10 dígitos).
  if (!w.__EL_XOLITO_WHATSAPP__) {
    w.__EL_XOLITO_WHATSAPP__ = '5214445428475';
  }
  // Google Identity Services — Client ID tipo "Aplicación web"
  // Créalo en https://console.cloud.google.com/apis/credentials
  // Orígenes autorizados: https://www.elxolitomex.com y https://elxolitomex.com
  if (!w.__EL_XOLITO_GOOGLE_CLIENT_ID__) {
    w.__EL_XOLITO_GOOGLE_CLIENT_ID__ = '866671007298-vc61a6u6i9phoh0vmd9gua4ktrd83km1.apps.googleusercontent.com';
  }
  w.getElXolitoApiBase = function getElXolitoApiBase() {
    return String(w.__EL_XOLITO_API__ || 'http://localhost:3000/api').replace(/\/$/, '');
  };
  w.getElXolitoGoogleClientId = function getElXolitoGoogleClientId() {
    return String(w.__EL_XOLITO_GOOGLE_CLIENT_ID__ || '').trim();
  };
})(typeof window !== 'undefined' ? window : globalThis);
