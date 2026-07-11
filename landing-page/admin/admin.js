/**
 * Panel administrativo El Xolito Mex
 * Independiente de la tienda; misma API y lógica de datos.
 */
(function () {
  'use strict';

  const TOKEN_KEY = 'adminAccessToken';
  const REFRESH_KEY = 'adminRefreshToken';
  const USER_KEY = 'adminUser';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  let categories = [];
  let products = [];
  let banners = [];
  let orders = [];
  let currentView = 'products';
  let editingId = null;
  let modalMode = null; // 'product' | 'banner' | 'order'

  function apiBase() {
    return (typeof window.getElXolitoApiBase === 'function'
      ? window.getElXolitoApiBase()
      : 'http://localhost:3000/api');
  }

  function assetUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return '../' + path.replace(/^\//, '');
  }

  function formatPrice(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
  }

  function showToast(msg, isError) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (isError ? ' toast--error' : '');
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { el.hidden = true; }, 3200);
  }

  async function api(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase()}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && token) {
      const refreshed = await tryRefresh();
      if (refreshed) return api(endpoint, options);
      logout();
      throw new Error('Sesión expirada');
    }

    if (!res.ok) throw new Error(data.message || 'Error en la petición');
    return data;
  }

  async function tryRefresh() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return false;
    try {
      const res = await fetch(`${apiBase()}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh })
      });
      const data = await res.json();
      if (data.success && data.data.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.data.accessToken);
        return true;
      }
    } catch (_) { /* ignore */ }
    return false;
  }

  async function login(email, password) {
    const res = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Credenciales incorrectas');
    }
    if (data.data.user.rol !== 'admin') {
      throw new Error('Esta cuenta no tiene permisos de administrador');
    }
    localStorage.setItem(TOKEN_KEY, data.data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
    return data.data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    closeModal();
    $('#adminApp').hidden = true;
    $('#loginScreen').hidden = false;
  }

  function showApp() {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
    $('#sidebarUser').textContent = user.email || '';
    closeModal();
    $('#loginScreen').hidden = true;
    $('#adminApp').hidden = false;
  }

  // ── Navigation ──
  const viewTitles = {
    products: 'Productos',
    'banners-oferta': 'Banners / Ofertas',
    'banners-hero': 'Hero / Portada',
    orders: 'Pedidos'
  };

  const ORDER_STATUS_LABELS = {
    pendiente_pago: 'Pendiente de pago',
    pagado: 'Pagado',
    preparando: 'Preparando',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado'
  };

  function switchView(view) {
    currentView = view;
    $$('.nav-item').forEach((el) => el.classList.toggle('is-active', el.dataset.view === view));
    $$('.admin-view').forEach((el) => { el.hidden = el.id !== `view-${view}`; });
    $('#viewTitle').textContent = viewTitles[view] || 'Admin';
    renderTopbarActions();
    if (view === 'products') loadProducts();
    else if (view === 'banners-oferta') loadBanners('oferta');
    else if (view === 'banners-hero') loadBanners(['hero', 'portada']);
    else if (view === 'orders') loadOrders();
  }

  function renderTopbarActions() {
    const wrap = $('#topbarActions');
    wrap.innerHTML = '';
    if (currentView === 'products') {
      wrap.innerHTML = '<button type="button" class="btn btn-primary" id="addProductBtn">+ Nuevo producto</button>';
      $('#addProductBtn').addEventListener('click', () => openProductModal());
    } else if (currentView === 'banners-oferta') {
      wrap.innerHTML = '<button type="button" class="btn btn-primary" id="addBannerBtn">+ Nuevo banner</button>';
      $('#addBannerBtn').addEventListener('click', () => openBannerModal('oferta'));
    } else if (currentView === 'banners-hero') {
      wrap.innerHTML = '<button type="button" class="btn btn-primary" id="addHeroBtn">+ Nuevo hero / portada</button>';
      $('#addHeroBtn').addEventListener('click', () => openBannerModal('hero'));
    }
  }

  // ── Products ──
  async function loadCategories() {
    const data = await api('/admin/products/meta/categories');
    categories = data.data.categories || [];
    const sel = $('#productCategoryFilter');
    const current = sel.value;
    sel.innerHTML = '<option value="">Todas las categorías</option>' +
      categories.map((c) => `<option value="${c}">${c}</option>`).join('');
    sel.value = current;
  }

  async function loadProducts() {
    const q = $('#productSearch').value.trim();
    const categoria = $('#productCategoryFilter').value;
    const activo = $('#productStatusFilter').value;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoria) params.set('categoria', categoria);
    if (activo !== '') params.set('activo', activo);

    const tbody = $('#productsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Cargando...</td></tr>';

    try {
      const data = await api(`/admin/products?${params}`);
      products = data.data.products || [];
      renderProductsTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${err.message}</td></tr>`;
    }
  }

  function renderProductsTable() {
    const tbody = $('#productsTableBody');
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay productos. Crea el primero con «Nuevo producto».</td></tr>';
      return;
    }

    tbody.innerHTML = products.map((p) => {
      const img = p.imagen_path
        ? `<img class="table-thumb" src="${assetUrl(p.imagen_path)}" alt="" />`
        : '<div class="table-thumb table-thumb--empty">—</div>';
      const badges = [
        p.activo ? '<span class="badge badge--ok">Activo</span>' : '<span class="badge badge--off">Inactivo</span>',
        p.destacado ? '<span class="badge badge--star">★ Destacado</span>' : ''
      ].filter(Boolean).join(' ');
      const price = p.precio_anterior
        ? `<s style="color:#aaa;font-size:0.8em">${formatPrice(p.precio_anterior)}</s> ${formatPrice(p.precio)}`
        : formatPrice(p.precio);

      return `<tr data-id="${p.id}">
        <td>${img}</td>
        <td><strong>${esc(p.nombre)}</strong></td>
        <td>${esc(p.categoria_nombre)}</td>
        <td>${price}</td>
        <td>${p.stock}</td>
        <td>${badges}</td>
        <td><div class="row-actions">
          <button type="button" class="icon-btn" data-edit-product="${p.id}" title="Editar">✎</button>
          <button type="button" class="icon-btn icon-btn--danger" data-del-product="${p.id}" title="Eliminar">✕</button>
        </div></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-edit-product]').forEach((btn) => {
      btn.addEventListener('click', () => openProductModal(parseInt(btn.dataset.editProduct, 10)));
    });
    tbody.querySelectorAll('[data-del-product]').forEach((btn) => {
      btn.addEventListener('click', () => deleteProduct(parseInt(btn.dataset.delProduct, 10)));
    });
  }

  function openProductModal(id = null) {
    editingId = id;
    modalMode = 'product';
    const p = id ? products.find((x) => x.id === id) : null;
    $('#modalTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';

    const catOptions = categories.map((c) =>
      `<option value="${c}" ${p && p.categoria_nombre === c ? 'selected' : ''}>${c}</option>`
    ).join('');

    $('#modalBody').innerHTML = `
      <form id="productForm" class="form-grid">
        <div class="form-field form-field--full">
          <label>Nombre *</label>
          <input name="nombre" required value="${escAttr(p?.nombre)}" />
        </div>
        <div class="form-field form-field--full">
          <label>Descripción</label>
          <textarea name="descripcion">${esc(p?.descripcion_corta || '')}</textarea>
        </div>
        <div class="form-field">
          <label>Precio (MXN) *</label>
          <input name="precio" type="number" step="0.01" min="0" required value="${p?.precio ?? ''}" />
        </div>
        <div class="form-field">
          <label>Precio anterior (oferta)</label>
          <input name="precio_anterior" type="number" step="0.01" min="0" value="${p?.precio_anterior ?? ''}" />
        </div>
        <div class="form-field">
          <label>Categoría *</label>
          <select name="categoria" required>${catOptions}</select>
        </div>
        <div class="form-field">
          <label>Material</label>
          <input name="material" value="${escAttr(p?.material)}" placeholder="Plata .925" />
        </div>
        <div class="form-field">
          <label>Stock</label>
          <input name="stock" type="number" min="0" value="${p?.stock ?? 0}" />
        </div>
        <div class="form-field">
          <label>Orden</label>
          <input name="orden" type="number" value="${p?.orden ?? 0}" />
        </div>
        <div class="form-field form-field--full form-checks">
          <label><input type="checkbox" name="activo" ${!p || p.activo ? 'checked' : ''} /> Activo en tienda</label>
          <label><input type="checkbox" name="destacado" ${p?.destacado ? 'checked' : ''} /> Destacado</label>
        </div>
        <div class="form-field form-field--full">
          <label>Imagen del producto (fondo negro)</label>
          <div class="image-upload">
            ${p?.imagen_path ? `<img class="image-upload__preview" id="productImgPreview" src="${assetUrl(p.imagen_path)}" alt="" />` : '<img class="image-upload__preview" id="productImgPreview" hidden alt="" />'}
            <input type="hidden" name="imagen_path" id="productImgPath" value="${escAttr(p?.imagen_path)}" />
            <input type="file" id="productImgFile" accept="image/jpeg,image/png,image/webp,image/gif" />
            <p style="font-size:0.8rem;color:#888;margin:0.5rem 0 0">JPG, PNG o WebP. Máx. 8 MB.</p>
          </div>
        </div>
        <div class="form-field form-field--full">
          <label>Imagen flip (fondo blanco, opcional)</label>
          <div class="image-upload">
            ${p?.imagen_blanca ? `<img class="image-upload__preview" id="productFlipPreview" src="${assetUrl(p.imagen_blanca)}" alt="" />` : '<img class="image-upload__preview" id="productFlipPreview" hidden alt="" />'}
            <input type="hidden" name="imagen_blanca" id="productFlipPath" value="${escAttr(p?.imagen_blanca)}" />
            <input type="file" id="productFlipFile" accept="image/jpeg,image/png,image/webp,image/gif" />
            <p style="font-size:0.8rem;color:#888;margin:0.5rem 0 0">Se muestra al girar la card en la tienda.</p>
          </div>
        </div>
        <p id="modalFormError" class="form-error form-field--full" hidden></p>
      </form>`;

    $('#modalFooter').innerHTML = `
      <button type="button" class="btn btn-outline" id="modalCancelBtn">Cancelar</button>
      <button type="button" class="btn btn-primary" id="modalSaveBtn">${p ? 'Guardar cambios' : 'Crear producto'}</button>`;

    $('#modalCancelBtn').addEventListener('click', closeModal);
    $('#modalSaveBtn').addEventListener('click', saveProduct);
    $('#productImgFile').addEventListener('change', (e) => uploadImage(e.target.files[0], 'productImgPath', 'productImgPreview'));
    $('#productFlipFile').addEventListener('change', (e) => uploadImage(e.target.files[0], 'productFlipPath', 'productFlipPreview'));
    $('#modalOverlay').hidden = false;
  }

  async function saveProduct() {
    const form = $('#productForm');
    const fd = new FormData(form);
    const body = {
      nombre: fd.get('nombre'),
      descripcion: fd.get('descripcion'),
      precio: fd.get('precio'),
      precio_anterior: fd.get('precio_anterior') || null,
      categoria: fd.get('categoria'),
      material: fd.get('material'),
      stock: fd.get('stock'),
      orden: fd.get('orden'),
      activo: form.querySelector('[name=activo]').checked,
      destacado: form.querySelector('[name=destacado]').checked,
      imagen_path: fd.get('imagen_path') || null,
      imagen_blanca: fd.get('imagen_blanca') || null
    };

    const errEl = $('#modalFormError');
    errEl.hidden = true;

    try {
      if (editingId) {
        await api(`/admin/products/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        showToast('Producto actualizado');
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
        showToast('Producto creado');
      }
      closeModal();
      loadProducts();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  }

  async function deleteProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!confirm(`¿Eliminar «${p?.nombre || 'este producto'}»? Esta acción no se puede deshacer.`)) return;
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      showToast('Producto eliminado');
      loadProducts();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Banners ──
  async function loadBanners(tipos) {
    const tipoList = Array.isArray(tipos) ? tipos : [tipos];
    const gridId = tipoList.includes('oferta') ? 'bannersOfertaGrid' : 'bannersHeroGrid';
    const grid = $(`#${gridId}`);
    grid.innerHTML = '<div class="empty-state">Cargando...</div>';

    try {
      const results = await Promise.all(
        tipoList.map((t) => api(`/admin/banners?tipo=${t}`))
      );
      banners = results.flatMap((r) => r.data.banners || []);
      renderBannersGrid(gridId, tipoList);
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }

  function renderBannersGrid(gridId, tipos) {
    const grid = $(`#${gridId}`);
    const filtered = banners.filter((b) => tipos.includes(b.tipo));

    if (!filtered.length) {
      grid.innerHTML = '<div class="empty-state">No hay contenido aún. Usa el botón de arriba para crear uno.</div>';
      return;
    }

    grid.innerHTML = filtered.map((b) => `
      <article class="banner-card" data-id="${b.id}">
        <img class="banner-card__img" src="${assetUrl(b.imagen_desktop)}" alt="" />
        <div class="banner-card__body">
          <h4 class="banner-card__title">${esc(b.titulo || 'Sin título')}</h4>
          <p class="banner-card__meta">${b.tipo} · ${b.activo ? 'Activo' : 'Inactivo'} · Orden ${b.orden}${b.etiqueta ? ` · ${esc(b.etiqueta)}` : ''}</p>
          <div class="banner-card__actions">
            <button type="button" class="btn btn-outline btn-sm" data-edit-banner="${b.id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-del-banner="${b.id}">Eliminar</button>
          </div>
        </div>
      </article>`).join('');

    grid.querySelectorAll('[data-edit-banner]').forEach((btn) => {
      btn.addEventListener('click', () => openBannerModal(null, parseInt(btn.dataset.editBanner, 10)));
    });
    grid.querySelectorAll('[data-del-banner]').forEach((btn) => {
      btn.addEventListener('click', () => deleteBanner(parseInt(btn.dataset.delBanner, 10)));
    });
  }

  function openBannerModal(defaultTipo = 'oferta', id = null) {
    editingId = id;
    modalMode = 'banner';
    const b = id ? banners.find((x) => x.id === id) : null;
    const tipo = b?.tipo || defaultTipo;

    $('#modalTitle').textContent = b ? 'Editar banner' : 'Nuevo banner';

    const tipoOptions = ['oferta', 'hero', 'portada'].map((t) =>
      `<option value="${t}" ${tipo === t ? 'selected' : ''}>${t}</option>`
    ).join('');

    $('#modalBody').innerHTML = `
      <form id="bannerForm" class="form-grid">
        <div class="form-field">
          <label>Tipo *</label>
          <select name="tipo">${tipoOptions}</select>
        </div>
        <div class="form-field">
          <label>Orden</label>
          <input name="orden" type="number" value="${b?.orden ?? 0}" />
        </div>
        <div class="form-field form-field--full">
          <label>Título <span class="label-hint">(opcional — déjalo vacío si la imagen ya trae el texto)</span></label>
          <input name="titulo" value="${escAttr(b?.titulo)}" placeholder="Vacío = no se muestra texto encima" />
        </div>
        <div class="form-field form-field--full">
          <label>Subtítulo</label>
          <input name="subtitulo" value="${escAttr(b?.subtitulo)}" />
        </div>
        <div class="form-field">
          <label>Etiqueta (ej. −20%)</label>
          <input name="etiqueta" value="${escAttr(b?.etiqueta)}" placeholder="−20%" />
        </div>
        <div class="form-field">
          <label>Texto del botón</label>
          <input name="texto_boton" value="${escAttr(b?.texto_boton)}" placeholder="Ver oferta" />
        </div>
        <div class="form-field">
          <label>Precio anterior</label>
          <input name="precio_anterior" type="number" step="0.01" min="0" value="${b?.precio_anterior ?? ''}" />
        </div>
        <div class="form-field">
          <label>Precio nuevo</label>
          <input name="precio_nuevo" type="number" step="0.01" min="0" value="${b?.precio_nuevo ?? ''}" />
        </div>
        <div class="form-field form-field--full">
          <label>Enlace (URL o ruta)</label>
          <input name="enlace" value="${escAttr(b?.enlace)}" placeholder="tienda?categoria=anillos" />
        </div>
        <div class="form-field">
          <label><input type="checkbox" name="activo" ${!b || b.activo ? 'checked' : ''} /> Activo</label>
        </div>
        <div class="form-field">
          <label>Inicio vigencia</label>
          <input name="fecha_inicio" type="datetime-local" value="${toDatetimeLocal(b?.fecha_inicio)}" />
        </div>
        <div class="form-field">
          <label>Fin vigencia</label>
          <input name="fecha_fin" type="datetime-local" value="${toDatetimeLocal(b?.fecha_fin)}" />
        </div>
        <div class="form-field form-field--full">
          <label>Imagen principal (desktop) *</label>
          <div class="image-upload">
            ${b?.imagen_desktop ? `<img class="image-upload__preview" id="bannerImgPreview" src="${assetUrl(b.imagen_desktop)}" alt="" />` : '<img class="image-upload__preview" id="bannerImgPreview" hidden alt="" />'}
            <input type="hidden" name="imagen_desktop" id="bannerImgPath" value="${escAttr(b?.imagen_desktop)}" />
            <input type="file" id="bannerImgFile" accept="image/jpeg,image/png,image/webp,image/gif" />
          </div>
        </div>
        <div class="form-field form-field--full">
          <label>Imagen móvil (opcional)</label>
          <div class="image-upload">
            ${b?.imagen_mobile ? `<img class="image-upload__preview" id="bannerMobilePreview" src="${assetUrl(b.imagen_mobile)}" alt="" />` : '<img class="image-upload__preview" id="bannerMobilePreview" hidden alt="" />'}
            <input type="hidden" name="imagen_mobile" id="bannerMobilePath" value="${escAttr(b?.imagen_mobile)}" />
            <input type="file" id="bannerMobileFile" accept="image/jpeg,image/png,image/webp,image/gif" />
          </div>
        </div>
        <p id="modalFormError" class="form-error form-field--full" hidden></p>
      </form>`;

    $('#modalFooter').innerHTML = `
      <button type="button" class="btn btn-outline" id="modalCancelBtn">Cancelar</button>
      <button type="button" class="btn btn-primary" id="modalSaveBtn">${b ? 'Guardar' : 'Crear banner'}</button>`;

    $('#modalCancelBtn').addEventListener('click', closeModal);
    $('#modalSaveBtn').addEventListener('click', saveBanner);
    $('#bannerImgFile').addEventListener('change', (e) => uploadImage(e.target.files[0], 'bannerImgPath', 'bannerImgPreview'));
    $('#bannerMobileFile').addEventListener('change', (e) => uploadImage(e.target.files[0], 'bannerMobilePath', 'bannerMobilePreview'));
    $('#modalOverlay').hidden = false;
  }

  async function saveBanner() {
    const form = $('#bannerForm');
    const fd = new FormData(form);
    const body = {
      tipo: fd.get('tipo'),
      titulo: fd.get('titulo'),
      subtitulo: fd.get('subtitulo'),
      enlace: fd.get('enlace'),
      texto_boton: fd.get('texto_boton'),
      etiqueta: fd.get('etiqueta'),
      precio_anterior: fd.get('precio_anterior') === '' ? null : fd.get('precio_anterior'),
      precio_nuevo: fd.get('precio_nuevo') === '' ? null : fd.get('precio_nuevo'),
      orden: fd.get('orden'),
      activo: form.querySelector('[name=activo]').checked,
      fecha_inicio: fd.get('fecha_inicio') || null,
      fecha_fin: fd.get('fecha_fin') || null,
      imagen_desktop: fd.get('imagen_desktop'),
      imagen_mobile: fd.get('imagen_mobile') || null
    };

    const errEl = $('#modalFormError');
    errEl.hidden = true;

    try {
      if (editingId) {
        await api(`/admin/banners/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
        showToast('Banner actualizado');
      } else {
        await api('/admin/banners', { method: 'POST', body: JSON.stringify(body) });
        showToast('Banner creado');
      }
      closeModal();
      if (currentView === 'banners-oferta') loadBanners('oferta');
      else loadBanners(['hero', 'portada']);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
    }
  }

  async function deleteBanner(id) {
    if (!confirm('¿Eliminar este banner?')) return;
    try {
      await api(`/admin/banners/${id}`, { method: 'DELETE' });
      showToast('Banner eliminado');
      if (currentView === 'banners-oferta') loadBanners('oferta');
      else loadBanners(['hero', 'portada']);
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Orders ──
  async function loadOrders() {
    const q = ($('#orderSearch')?.value || '').trim();
    const estado = $('#orderStatusFilter')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (estado) params.set('estado', estado);

    const tbody = $('#ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Cargando...</td></tr>';

    try {
      const data = await api(`/admin/orders?${params.toString()}`);
      orders = data.data.orders || [];
      renderOrdersTable();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${esc(err.message)}</td></tr>`;
    }
  }

  function renderOrdersTable() {
    const tbody = $('#ordersTableBody');
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay pedidos</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map((o) => {
      const cliente = o.usuario_nombre || o.usuario_email || `Usuario #${o.usuario_id}`;
      const fecha = o.created_at ? new Date(o.created_at.replace(' ', 'T')).toLocaleString('es-MX') : '—';
      const statusLabel = ORDER_STATUS_LABELS[o.estado] || o.estado;
      return `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>
            <div>${esc(cliente)}</div>
            ${o.usuario_email && o.usuario_nombre ? `<div class="cell-muted">${esc(o.usuario_email)}</div>` : ''}
          </td>
          <td>${formatPrice(o.total)}</td>
          <td><span class="badge badge--status badge--${escAttr(o.estado)}">${esc(statusLabel)}</span></td>
          <td>${o.items_count ?? '—'}</td>
          <td>${esc(fecha)}</td>
          <td class="td-actions">
            <button type="button" class="btn btn-outline btn-sm" data-view-order="${o.id}">Ver</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-view-order]').forEach((btn) => {
      btn.addEventListener('click', () => openOrderModal(parseInt(btn.dataset.viewOrder, 10)));
    });
  }

  async function openOrderModal(id) {
    editingId = id;
    modalMode = 'order';
    $('#modalTitle').textContent = `Pedido #${id}`;
    $('#modalBody').innerHTML = '<p class="view-hint">Cargando detalle...</p>';
    $('#modalFooter').innerHTML = '<button type="button" class="btn btn-outline" id="modalCancelBtn">Cerrar</button>';
    $('#modalCancelBtn').addEventListener('click', closeModal);
    $('#modalOverlay').hidden = false;

    try {
      const data = await api(`/admin/orders/${id}`);
      const o = data.data.order;
      const statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) =>
        `<option value="${value}" ${o.estado === value ? 'selected' : ''}>${label}</option>`
      ).join('');

      const itemsHtml = (o.items || []).map((item) => `
        <tr>
          <td>
            <div class="order-item-cell">
              ${item.imagen_path ? `<img src="${assetUrl(item.imagen_path)}" alt="" class="order-item-thumb" />` : ''}
              <span>${esc(item.nombre)}</span>
            </div>
          </td>
          <td>${item.cantidad}</td>
          <td>${formatPrice(item.precio_unitario)}</td>
          <td>${formatPrice(item.subtotal)}</td>
        </tr>`).join('');

      $('#modalBody').innerHTML = `
        <form id="orderForm" class="form-grid">
          <div class="form-field">
            <label>Cliente</label>
            <input value="${escAttr(o.usuario_nombre || '')}" disabled />
          </div>
          <div class="form-field">
            <label>Email</label>
            <input value="${escAttr(o.usuario_email || '')}" disabled />
          </div>
          <div class="form-field">
            <label>Estado</label>
            <select name="estado">${statusOptions}</select>
          </div>
          <div class="form-field">
            <label>Total</label>
            <input value="${formatPrice(o.total)}" disabled />
          </div>
          <div class="form-field form-field--full">
            <label>Dirección de entrega</label>
            <input name="direccion_entrega" value="${escAttr(o.direccion_entrega || '')}" />
          </div>
          <div class="form-field form-field--full">
            <label>Contacto</label>
            <input name="contacto" value="${escAttr(o.contacto || '')}" />
          </div>
          <div class="form-field form-field--full">
            <label>Fecha</label>
            <input value="${escAttr(o.created_at || '')}" disabled />
          </div>
          <div class="form-field form-field--full">
            <label>Ítems</label>
            <div class="table-wrap table-wrap--compact">
              <table class="data-table">
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>${itemsHtml || '<tr><td colspan="4" class="table-empty">Sin ítems</td></tr>'}</tbody>
              </table>
            </div>
          </div>
          <p id="modalFormError" class="form-error form-field--full" hidden></p>
        </form>`;

      $('#modalFooter').innerHTML = `
        <button type="button" class="btn btn-outline" id="modalCancelBtn">Cerrar</button>
        <button type="button" class="btn btn-primary" id="modalSaveBtn">Guardar cambios</button>`;
      $('#modalCancelBtn').addEventListener('click', closeModal);
      $('#modalSaveBtn').addEventListener('click', saveOrder);
    } catch (err) {
      $('#modalBody').innerHTML = `<p class="form-error">${esc(err.message)}</p>`;
    }
  }

  async function saveOrder() {
    const form = $('#orderForm');
    if (!form || !editingId) return;
    const fd = new FormData(form);
    const body = {
      estado: fd.get('estado'),
      direccion_entrega: fd.get('direccion_entrega'),
      contacto: fd.get('contacto')
    };
    const errEl = $('#modalFormError');
    if (errEl) errEl.hidden = true;

    try {
      await api(`/admin/orders/${editingId}`, { method: 'PATCH', body: JSON.stringify(body) });
      showToast('Pedido actualizado');
      closeModal();
      loadOrders();
    } catch (err) {
      if (errEl) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      } else {
        showToast(err.message, true);
      }
    }
  }

  // ── Upload ──
  async function uploadImage(file, pathInputId, previewId) {
    if (!file) return;
    const pathInput = $(`#${pathInputId}`);
    const preview = $(`#${previewId}`);
    const token = localStorage.getItem(TOKEN_KEY);

    const fd = new FormData();
    fd.append('image', file);

    try {
      const res = await fetch(`${apiBase()}/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al subir');
      pathInput.value = data.data.path;
      preview.src = assetUrl(data.data.path);
      preview.hidden = false;
      showToast('Imagen subida');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ── Modal ──
  function closeModal() {
    $('#modalOverlay').hidden = true;
    $('#modalBody').innerHTML = '';
    $('#modalFooter').innerHTML = '';
    editingId = null;
    modalMode = null;
  }

  // ── Utils ──
  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function escAttr(s) {
    return esc(s).replace(/"/g, '&quot;');
  }

  function toDatetimeLocal(str) {
    if (!str) return '';
    const d = new Date(str.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ── Init ──
  function init() {
    closeModal();

    $('#loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = $('#loginError');
      errEl.hidden = true;
      try {
        await login($('#loginEmail').value, $('#loginPassword').value);
        showApp();
        await loadCategories();
        switchView('products');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      }
    });

    $('#logoutBtn').addEventListener('click', logout);
    $('#modalClose').addEventListener('click', closeModal);
    $('#modalOverlay').addEventListener('click', (e) => {
      if (e.target === $('#modalOverlay')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('#modalOverlay').hidden) closeModal();
    });

    $$('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    let searchTimer;
    $('#productSearch').addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(loadProducts, 300);
    });
    $('#productCategoryFilter').addEventListener('change', loadProducts);
    $('#productStatusFilter').addEventListener('change', loadProducts);

    let orderSearchTimer;
    const orderSearch = $('#orderSearch');
    const orderStatus = $('#orderStatusFilter');
    if (orderSearch) {
      orderSearch.addEventListener('input', () => {
        clearTimeout(orderSearchTimer);
        orderSearchTimer = setTimeout(loadOrders, 300);
      });
    }
    if (orderStatus) {
      orderStatus.addEventListener('change', loadOrders);
    }

    if (localStorage.getItem(TOKEN_KEY)) {
      showApp();
      loadCategories().then(() => switchView('products')).catch(logout);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
