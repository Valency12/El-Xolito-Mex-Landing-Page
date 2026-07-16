/**
 * Cotización por WhatsApp — mensaje prellenado con productos del carrito.
 * Cargar después de config.js.
 */
(function (w) {
  'use strict';

  const DEFAULT_PHONE = '5214445428475';
  const MAX_MESSAGE_CHARS = 1800;

  function getWhatsAppPhone() {
    const raw = String(w.__EL_XOLITO_WHATSAPP__ || DEFAULT_PHONE).replace(/\D/g, '');
    return raw || DEFAULT_PHONE;
  }

  function getSiteBaseUrl() {
    const configured = String(w.__EL_XOLITO_SITE_URL__ || '').trim().replace(/\/$/, '');
    if (configured) return configured;
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin.replace(/\/$/, '');
    }
    return '';
  }

  function toAbsoluteUrl(path) {
    if (!path) return '';
    const value = String(path).trim();
    if (/^https?:\/\//i.test(value)) return value;
    const base = getSiteBaseUrl();
    if (!base) return value;
    // Codifica cada segmento (espacios, acentos) para que el link no se rompa
    const clean = value
      .replace(/^\/+/, '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `${base}/${clean}`;
  }

  function getProductPageUrl(productId) {
    const base = getSiteBaseUrl();
    const path = `producto?id=${encodeURIComponent(productId)}`;
    return base ? `${base}/${path}` : path;
  }

  /** Evita mostrar en WhatsApp nombres feos tipo "ChatGPT Image ...png" */
  function shouldIncludePhotoLink(imagePath) {
    if (!imagePath) return false;
    const fileName = String(imagePath).split('/').pop() || '';
    const ugly = /chatgpt|generated|midjourney|dall-?e|screenshot|img_\d{6,}/i.test(fileName);
    const hasSpacesOrNoise = /\s|\,|\(/.test(fileName);
    return !ugly && !hasSpacesOrNoise;
  }

  function formatMoney(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '$0';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  }

  function getItemName(item) {
    return item?.name || item?.nombre || 'Producto';
  }

  function getItemPrice(item) {
    const price = item?.price ?? item?.precio ?? 0;
    return Number(price) || 0;
  }

  function getItemImagePath(item) {
    if (item?.image) return item.image;
    if (item?.imagenes?.length) {
      const main = item.imagenes.find((img) => img.es_principal) || item.imagenes[0];
      return main?.ruta || '';
    }
    return '';
  }

  function getItemMaterial(item) {
    return item?.material || item?.categoria_nombre || item?.category || '';
  }

  function buildItemBlock(item, index) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unit = getItemPrice(item);
    const subtotal = unit * qty;
    const lines = [
      `${index + 1}. *${getItemName(item)}*`,
      `   Cantidad: ${qty} · ${formatMoney(unit)} c/u · Subtotal: ${formatMoney(subtotal)}`
    ];
    const material = getItemMaterial(item);
    if (material) lines.push(`   Material: ${material}`);
    if (item.id) lines.push(`   Ver pieza: ${getProductPageUrl(item.id)}`);
    // Solo adjuntar link de foto si el nombre de archivo es limpio (no "ChatGPT Image...")
    const imagePath = getItemImagePath(item);
    if (shouldIncludePhotoLink(imagePath)) {
      const imageUrl = toAbsoluteUrl(imagePath);
      if (imageUrl) lines.push(`   Foto: ${imageUrl}`);
    }
    return lines.join('\n');
  }

  function buildWhatsAppQuoteMessage({ items = [], pedidoId = null, customerName = '' } = {}) {
    const validItems = (items || []).filter((item) => item && (item.id || getItemName(item)));
    const total = validItems.reduce((sum, item) => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      return sum + getItemPrice(item) * qty;
    }, 0);

    const greeting = customerName
      ? `¡Hola! Soy *${customerName}* y me interesa cotizar en *El Xolito Mex*.`
      : '¡Hola! Me interesa cotizar en *El Xolito Mex*.';

    const parts = [greeting, ''];
    if (pedidoId) {
      parts.push(`*Pedido registrado #${pedidoId}*`, '');
    }
    parts.push('*Productos de interés:*', '');
    validItems.forEach((item, i) => {
      parts.push(buildItemBlock(item, i));
      parts.push('');
    });
    parts.push(`*Total estimado: ${formatMoney(total)}*`, '');
    parts.push('¿Podrían confirmar disponibilidad, envío y forma de pago?');
    parts.push('Gracias!');

    let message = parts.join('\n').trim();
    if (message.length > MAX_MESSAGE_CHARS) {
      message =
        message.slice(0, MAX_MESSAGE_CHARS - 40).trim() +
        '\n\n…(mensaje recortado por límite de WhatsApp)';
    }
    return message;
  }

  function openWhatsAppQuote(options = {}) {
    const message = buildWhatsAppQuoteMessage(options);
    const phone = getWhatsAppPhone();
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return { opened: true, url, message };
  }

  w.whatsAppService = {
    getWhatsAppPhone,
    getSiteBaseUrl,
    toAbsoluteUrl,
    getProductPageUrl,
    buildWhatsAppQuoteMessage,
    openWhatsAppQuote
  };
})(typeof window !== 'undefined' ? window : globalThis);
