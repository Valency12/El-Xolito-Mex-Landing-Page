# Pendientes para dejar el proyecto al 100%

Lista orientativa. Algunos ítems dependen de **presupuesto** (VPS) o de **decisiones de negocio** (WhatsApp, precios).

---

## Infraestructura y producción

- [ ] **API en internet** — Desplegar el backend (Node) en Hostinger VPS, otro proveedor o tier gratuito (Railway, Render, Fly.io, etc.).
- [ ] **HTTPS** — Certificado válido en la API (y en el sitio si aplica). El frontend en HTTPS no debe llamar a API solo HTTP.
- [ ] **`landing-page/config.js`** — Definir `window.__EL_XOLITO_API__` con la URL real de la API (termina en `/api`, sin barra final).
- [ ] **CORS** — En el backend, variable `CORS_ORIGINS` con el/los dominios del sitio (ver `DEPLOYMENT.md`).
- [ ] **Variables de entorno** — `JWT_SECRET`, `PORT`, etc., en el servidor; nunca commitear secretos.
- [ ] **Base de datos en producción** — SQLite en disco persistente del servidor **o** migrar a PostgreSQL si el hosting es efímero; plan de **copias de seguridad**.
- [ ] **Proceso persistente** — PM2, systemd u equivalente para que la API no se caiga al cerrar sesión SSH.

---

## Compra y operación (negocio)

- [ ] **Flujo de compra manual por WhatsApp** — Texto claro en sitio, botón/enlace con mensaje prellenado (carrito o producto), número oficial; decidir si se **oculta** o **deshabilita** “Proceder al pago” hasta tener pasarela o API estable.
- [ ] **(Opcional)** Pasarela de pago real (Stripe, Mercado Pago, etc.) si en el futuro quieren cobro automático en la web.

---

## Contenido y catálogo

- [ ] **Ofertas** — Textos, precios y enlaces “Ver oferta” alineados con la tienda real.
- [ ] **Imágenes** — Sustituir o retocar fotos con marcas de agua (p. ej. Gemini) cuando haya material final.
- [ ] **Stock y productos** — IDs y datos en la base alineados con lo que muestra el frontend (evitar carrito con productos que no existan en la API).

---

## Calidad, SEO y confianza

- [ ] **Prueba en dispositivos reales** — Móvil y tablet en las páginas principales (inicio, tienda, producto, carrito, login).
- [ ] **Favicon** y **meta Open Graph** — Mejor apariencia al compartir el enlace (WhatsApp, redes).
- [ ] **Meta descripciones** — Por página donde falten (`tienda`, `producto`, `mi-cuenta`, etc.).
- [ ] **(Opcional)** Aviso de privacidad / cookies según lo que recolectes (formularios, analytics).

---

## Técnico (mantenimiento, no bloqueante)

- [ ] **Reducir duplicación en `style.css`** — Facilita futuros cambios de diseño.
- [ ] **Monitoreo simple** — Revisar periódicamente `GET /api/health` en producción.

---

## Documentación ya en el repo

- `README.md` — Cómo levantar proyecto en local.
- `DEPLOYMENT.md` — Estático vs API, CORS, `config.js`.

---

*Última actualización: checklist interno del equipo; ir tachando según avance.*
