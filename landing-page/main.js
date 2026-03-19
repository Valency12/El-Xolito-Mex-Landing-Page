
// Variable global para almacenar productos cargados desde la API
let PRODUCTS = [];

// Productos de ejemplo cuando la API no está disponible (misma forma que la API)
const EXAMPLE_PRODUCTS = [
	{ id: 1, nombre: 'Broqueles Colibrí', precio: 320, material: 'Plata .925', categoria_nombre: 'Broqueles', categoria_slug: 'broqueles', destacado: 1, imagenes: [{ ruta: 'assets/Broqueles/broqueles-colibri.jpg', es_principal: true }], image: 'assets/Broqueles/broqueles-colibri.jpg', descripcion_corta: 'Broqueles inspirados en el colibrí.', color: null, stock: 8 },
	{ id: 2, nombre: 'Broqueles Catarina', precio: 280, material: 'Plata .925', categoria_nombre: 'Broqueles', categoria_slug: 'broqueles', destacado: 0, imagenes: [{ ruta: 'assets/Broqueles/broqueles-catarina.jpg', es_principal: true }], image: 'assets/Broqueles/broqueles-catarina.jpg', descripcion_corta: 'Broqueles con motivo de catarina.', color: null, stock: 12 },
	{ id: 3, nombre: 'Pulsera Curb Chain', precio: 650, material: 'Plata .925', categoria_nombre: 'Pulseras', categoria_slug: 'pulseras', destacado: 1, imagenes: [{ ruta: 'assets/Pulseras/pulsera-curb.jpg', es_principal: true }], image: 'assets/Pulseras/pulsera-curb.jpg', descripcion_corta: 'Pulsera tipo curb chain.', color: null, stock: 10 },
	{ id: 4, nombre: 'Collar Colgante Corazón', precio: 480, material: 'Plata .925', categoria_nombre: 'Collares', categoria_slug: 'collares', destacado: 0, imagenes: [{ ruta: 'assets/Collares/collar-corazon.jpg', es_principal: true }], image: 'assets/Collares/collar-corazon.jpg', descripcion_corta: 'Collar con dije corazón.', color: null, stock: 7 },
	{ id: 5, nombre: 'Anillo Sello', precio: 520, material: 'Plata .925', categoria_nombre: 'Anillos', categoria_slug: 'anillos', destacado: 1, imagenes: [{ ruta: 'assets/Anillos/anillo-sello.png', es_principal: true }], image: 'assets/Anillos/anillo-sello.png', descripcion_corta: 'Anillo tipo sello con diseño artesanal.', color: null, stock: 3 },
	{ id: 6, nombre: 'Aretes Hoops Pequeños', precio: 290, material: 'Plata .925', categoria_nombre: 'Aretes', categoria_slug: 'aretes', destacado: 0, imagenes: [{ ruta: 'assets/Aretes/hoops-pequenos.jpg', es_principal: true }], image: 'assets/Aretes/hoops-pequenos.jpg', descripcion_corta: 'Aretes tipo hoop en plata.', color: null, stock: 15 },
	{ id: 7, nombre: 'Dije Colibrí', precio: 220, material: 'Plata .925', categoria_nombre: 'Dijes', categoria_slug: 'dijes', destacado: 0, imagenes: [{ ruta: 'assets/Dijes/dije-colibri.jpg', es_principal: true }], image: 'assets/Dijes/dije-colibri.jpg', descripcion_corta: 'Dije colibrí para cadena.', color: null, stock: 20 },
	{ id: 8, nombre: 'Brazalete Canasta', precio: 580, material: 'Plata .925', categoria_nombre: 'Brazaletes', categoria_slug: 'brazaletes', destacado: 1, imagenes: [{ ruta: 'assets/Brazaletes/brazalete-canasta.jpg', es_principal: true }], image: 'assets/Brazaletes/brazalete-canasta.jpg', descripcion_corta: 'Brazalete tipo canasta.', color: null, stock: 6 }
];

// Función para esperar a que productService esté disponible
async function waitForProductService(maxAttempts = 50, delay = 200) {
	console.log('⏳ Esperando a que productService esté disponible...');
	for (let i = 0; i < maxAttempts; i++) {
		if (window.productService) {
			console.log(`✅ productService disponible después de ${i + 1} intentos`);
			return true;
		}
		if (i % 10 === 0 && i > 0) {
			console.log(`⏳ Esperando... (intento ${i + 1}/${maxAttempts})`);
		}
		await new Promise(resolve => setTimeout(resolve, delay));
	}
	console.error('❌ productService no está disponible después de esperar');
	return false;
}

// Función para cargar productos desde la API
async function loadProductsFromAPI() {
	try {
		console.log('🔄 Iniciando carga de productos desde la API...');
		
		// Esperar a que productService esté disponible (hasta 10 segundos)
		const serviceAvailable = await waitForProductService(50, 200);
		if (!serviceAvailable) {
			console.error('❌ productService no está disponible después de esperar 10 segundos');
			console.error('   Verifica que services/productService.js se esté cargando correctamente');
			console.error('   Asegúrate de que el servidor backend esté corriendo en http://localhost:3000');
			return [];
		}
		
		console.log('✅ productService disponible, haciendo petición a la API...');
		console.log('🔗 URL de la API: http://localhost:3000/api/products?activo=1');
		
		const result = await window.productService.getAllProducts({ activo: '1' });
		console.log('📦 Respuesta de la API recibida');
		console.log('📊 Estado del resultado:', {
			success: result.success,
			productsCount: result.products?.length || 0,
			message: result.message
		});
		
		if (result.success && result.products && result.products.length > 0) {
			// Formatear productos para compatibilidad con el código existente
			PRODUCTS = result.products.map(apiProduct => 
				window.productService.formatProductForFrontend(apiProduct)
			);
			console.log(`✅ Cargados ${PRODUCTS.length} productos desde la API`);
			console.log('   Primeros productos:', PRODUCTS.slice(0, 3).map(p => `${p.name} (${p.category})`));
			console.log('   Todas las categorías:', [...new Set(PRODUCTS.map(p => p.category))]);
			return PRODUCTS;
		} else {
			console.warn('⚠️ No se pudieron cargar productos desde la API');
			console.warn('   success:', result.success);
			console.warn('   products:', result.products?.length || 0);
			console.warn('   message:', result.message);
			return [];
		}
	} catch (error) {
		console.error('❌ Error al cargar productos desde la API:', error);
		console.error('   Tipo de error:', error.name);
		console.error('   Mensaje:', error.message);
		console.error('   Stack:', error.stack);
		console.error('   Verifica:');
		console.error('   1. ¿El servidor backend está corriendo? http://localhost:3000');
		console.error('   2. ¿La API está respondiendo? Prueba: http://localhost:3000/api/products');
		console.error('   3. ¿Hay errores de CORS?');
		// En caso de error, retornar array vacío para evitar errores
		return [];
	}
}

// Función para obtener un producto por ID (compatibilidad con código existente)
async function getProductById(id) {
	const numId = typeof id === 'string' ? parseInt(id, 10) : id;
	if (Number.isNaN(numId)) return null;
	const cachedProduct = PRODUCTS.find(p => p.id === numId || p.id == id);
	if (cachedProduct) {
		return cachedProduct;
	}
	
	// Si no está en cache, intentar cargarlo desde la API
	try {
		if (window.productService) {
			const result = await window.productService.getProductById(id);
			if (result.success && result.product) {
				return window.productService.formatProductForFrontend(result.product);
			}
		}
	} catch (error) {
		console.error('Error al obtener producto:', error);
	}
	
	return null;
}

// Cart functionality
class Cart {
	constructor() {
		this.items = this.loadFromStorage();
		this.updateCartUI();
	}

	loadFromStorage() {
		try {
			return JSON.parse(localStorage.getItem('cart') || '[]');
		} catch {
			return [];
		}
	}

	saveToStorage() {
		localStorage.setItem('cart', JSON.stringify(this.items));
	}

	async addItem(productId, quantity = 1) {
		// Intentar obtener el producto desde cache o API
		let product = PRODUCTS.find(p => p.id == productId);
		
		// Si no está en cache, cargarlo desde la API
		if (!product) {
			product = await getProductById(productId);
		}
		
		if (!product) {
			console.warn('Producto no encontrado:', productId);
			return;
		}

		const existingItem = this.items.find(item => item.id == productId);
		if (existingItem) {
			existingItem.quantity += quantity;
		} else {
			this.items.push({ ...product, quantity });
		}
		this.saveToStorage();
		// Actualizar UI inmediatamente
		this.updateCartUI();
	}

	removeItem(productId) {
		this.items = this.items.filter(item => item.id != productId);
		this.saveToStorage();
		this.updateCartUI();
	}

	updateQuantity(productId, quantity) {
		const item = this.items.find(item => item.id == productId);
		if (item) {
			if (quantity <= 0) {
				this.removeItem(productId);
			} else {
				item.quantity = quantity;
				this.saveToStorage();
				this.updateCartUI();
			}
		}
	}

	getTotal() {
		return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
	}

	getItemCount() {
		return this.items.reduce((total, item) => total + item.quantity, 0);
	}

	updateCartUI() {
		const cartToggle = document.querySelector('.cart-toggle');
		const cartItems = document.getElementById('cartItems');
		const cartTotal = document.getElementById('cartTotal');
		const cartEmpty = document.querySelector('.cart-empty');
		const cartCheckout = document.querySelector('.cart-checkout');

		// Calcular el total de items
		const count = this.getItemCount();
		
		// Actualizar el contador del carrito en TODOS los botones del carrito
		const allCartToggles = document.querySelectorAll('.cart-toggle');
		allCartToggles.forEach(toggle => {
			toggle.setAttribute('data-count', count);
			// Si el contador es 0, asegurar que muestre 0
			if (count === 0) {
				toggle.setAttribute('data-count', '0');
			}
		});

		// Actualizar el contenido del carrito modal si existe (incluso si está cerrado)
		if (cartItems && cartTotal && cartEmpty && cartCheckout) {
			if (this.items.length === 0) {
				cartItems.style.display = 'none';
				cartEmpty.style.display = 'block';
				cartCheckout.disabled = true;
			} else {
				cartItems.style.display = 'block';
				cartEmpty.style.display = 'none';
				cartCheckout.disabled = false;
				
				// Renderizar los items del carrito
				cartItems.innerHTML = this.items.map(item => {
					const itemTotal = formatCurrency(item.price * item.quantity);
					return `
					<div class="cart-item">
						<div class="cart-item-media">
							${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" onerror="this.parentElement.innerHTML = '${createPlaceholderSVG(item.id).replace(/'/g, "\\'")}'">` : createPlaceholderSVG(item.id)}
						</div>
						<div class="cart-item-info">
							<div class="cart-item-name">${item.name}</div>
							<div class="cart-item-price">${formatCurrency(item.price)} c/u</div>
							<div class="cart-item-controls">
								<div class="cart-item-qty">
									<button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})" aria-label="Disminuir cantidad">-</button>
									<span>${item.quantity}</span>
									<button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})" aria-label="Aumentar cantidad">+</button>
								</div>
								<div style="font-weight: 600; color: var(--verde); margin-top: 0.5rem;">Subtotal: ${itemTotal}</div>
								<button class="cart-item-remove" onclick="cart.removeItem('${item.id}')">Eliminar</button>
							</div>
						</div>
					</div>
				`;
				}).join('');
				
				// Actualizar el total
				cartTotal.textContent = formatCurrency(this.getTotal());
			}
		}
	}
}

// Initialize cart
const cart = new Cart();

// Hacer el carrito accesible globalmente para funciones onclick
window.cart = cart;

function formatCurrency(mx) {
	return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(mx);
}

function createPlaceholderSVG(id) {
	const palette = ['#e8d79c', '#2a868f', '#2e694f', '#e7509d'];
	const a = palette[id.charCodeAt(0) % palette.length];
	const b = palette[id.charCodeAt(1) % palette.length];
	return `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Imagen del producto">
			<defs>
				<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stop-color="${a}"/>
					<stop offset="1" stop-color="${b}"/>
				</linearGradient>
			</defs>
			<rect width="400" height="400" fill="url(#g)"/>
			<circle cx="300" cy="120" r="18" fill="#e63f46"/>
			<path d="M40 300 L100 220 L160 300 L220 200 L300 300" fill="none" stroke="#2e694f" stroke-width="10" stroke-linecap="round"/>
		</svg>
	`;
}


// Ejemplo de renderizado simple para cada producto
/* ============================================
   CÓDIGO ANTERIOR COMENTADO - DISEÑO NUEVO
   ============================================ */
/*
function renderProducts(products) {
  // ... código anterior comentado ...
}
*/

// Alias de compatibilidad: el código legado (categorías/filtros) llama a `renderProducts(...)`.
// Ahora redirigimos a la versión con el diseño nuevo para que la tienda funcione por categoría.
function renderProducts(products) {
	renderProductsSimple(products);
}

/* ============================================
   NUEVO DISEÑO SIMPLE PARA PRODUCTOS
   ============================================ */

// Función simple para cargar productos desde la API
async function loadProductsSimple() {
  try {
    console.log('🔄 Cargando productos desde la API...');
    
    const response = await fetch('http://localhost:3000/api/products?activo=1');
    
    // Verificar si el servidor está respondiendo
    if (!response.ok) {
      if (response.status === 0 || response.status >= 500) {
        throw new Error(`El servidor backend no está respondiendo (status: ${response.status}). Verifica que esté corriendo en http://localhost:3000`);
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Respuesta de la API recibida');
    
    // Verificar estructura de respuesta
    if (data.success && data.data && data.data.products) {
      const products = data.data.products;
      console.log(`✅ Se encontraron ${products.length} productos en la base de datos`);
      if (products.length > 0) {
        if (window.productService && window.productService.formatProductForFrontend) {
          PRODUCTS = products.map(p => window.productService.formatProductForFrontend(p));
        } else {
          PRODUCTS = products.map(p => ({ id: p.id, name: p.nombre, price: p.precio, material: p.material, image: (p.imagenes && p.imagenes[0]) ? p.imagenes[0].ruta : null, category: p.categoria_slug, imagenes: p.imagenes || [], color: p.color }));
        }
        return PRODUCTS;
      }
      console.warn('⚠️ Sin productos en la API, usando ejemplos');
      const fallback = EXAMPLE_PRODUCTS;
      PRODUCTS = fallback.map(p => window.productService ? window.productService.formatProductForFrontend(p) : ({ id: p.id, name: p.nombre, price: p.precio, material: p.material, image: p.image, category: p.categoria_slug, imagenes: p.imagenes, color: p.color }));
      return PRODUCTS;
    } else if (data.success && Array.isArray(data.data)) {
      console.log(`✅ Se encontraron ${data.data.length} productos en la base de datos`);
      if (window.productService && window.productService.formatProductForFrontend) {
        PRODUCTS = data.data.map(p => window.productService.formatProductForFrontend(p));
      } else {
        PRODUCTS = data.data.map(p => ({ id: p.id, name: p.nombre, price: p.precio, material: p.material, image: (p.imagenes && p.imagenes[0]) ? p.imagenes[0].ruta : null, category: p.categoria_slug, imagenes: p.imagenes || [], color: p.color }));
      }
      return PRODUCTS;
    } else {
      console.warn('⚠️ La API no devolvió productos, usando ejemplos');
      if (window.productService && window.productService.formatProductForFrontend) {
        PRODUCTS = EXAMPLE_PRODUCTS.map(p => window.productService.formatProductForFrontend(p));
      } else {
        PRODUCTS = EXAMPLE_PRODUCTS.map(p => ({ id: p.id, name: p.nombre, price: p.precio, material: p.material, image: p.image, category: p.categoria_slug, imagenes: p.imagenes, color: p.color }));
      }
      return PRODUCTS;
    }
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.warn('⚠️ API no disponible, usando productos de ejemplo');
    } else {
      console.warn('⚠️ Error al cargar productos:', error.message, '– usando productos de ejemplo');
    }
    const fallback = EXAMPLE_PRODUCTS;
    if (window.productService && window.productService.formatProductForFrontend) {
      PRODUCTS = fallback.map(p => window.productService.formatProductForFrontend(p));
    } else {
      PRODUCTS = fallback.map(p => ({ id: p.id, name: p.nombre, price: p.precio, material: p.material, image: p.image, category: p.categoria_slug, imagenes: p.imagenes, color: p.color }));
    }
    return PRODUCTS;
  }
}

// Placeholder cuando la imagen del producto no existe (ruta 404)
const PLACEHOLDER_IMAGE = 'assets/placeholder.svg';
// Imagen de categoría por slug (archivos que sí existen en assets/Categorias/)
const CATEGORY_IMAGE_BY_SLUG = {
  anillos: 'assets/Categorias/anillo.png',
  brazaletes: 'assets/Categorias/brazaletes.png',
  collares: 'assets/Categorias/collar.png',
  aretes: 'assets/Categorias/aretes.png',
  broqueles: 'assets/Categorias/broqueles.png',
  pulseras: 'assets/Categorias/pulseras.png',
  dijes: 'assets/Categorias/dije.png',
  conjuntos: 'assets/Categorias/conjunto.png'
};

function getProductImageUrl(product) {
  if (product.image) return product.image;
  if (product.imagenes && product.imagenes.length > 0) {
    const main = product.imagenes.find(img => img.es_principal) || product.imagenes[0];
    if (main && main.ruta) return main.ruta;
  }
  return PLACEHOLDER_IMAGE;
}

function getProductFallbackImage(product) {
  const slug = (product.category || product.categoria_slug || '').toLowerCase();
  return CATEGORY_IMAGE_BY_SLUG[slug] || PLACEHOLDER_IMAGE;
}

// Mostrar estado "Cargando productos..." en el grid (feedback inmediato para el usuario)
function showProductGridLoading() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.className = '';
  grid.innerHTML = '<p class="tienda-loading">Cargando productos…</p>';
}

// Función simple para renderizar productos con diseño nuevo
function renderProductsSimple(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) {
    console.error('❌ No se encontró el elemento productGrid');
    return;
  }

  const productosSection = document.getElementById('productos');
  if (productosSection) {
    productosSection.style.display = 'block';
  }

  grid.innerHTML = '';
  grid.className = 'tienda-product-grid';

  if (!products || products.length === 0) {
    grid.innerHTML = '<p class="tienda-empty">No hay productos disponibles</p>';
    return;
  }

  const productName = (p) => p.name != null ? p.name : p.nombre;
  const productPrice = (p) => (p.price != null ? p.price : p.precio) || 0;

  products.forEach(product => {
    const imageUrl = getProductImageUrl(product);
    const fallbackUrl = getProductFallbackImage(product);
    const nombre = productName(product);
    const precio = productPrice(product);
    const material = product.material || 'Material no especificado';

    const card = document.createElement('article');
    card.className = 'tienda-product-card';
    card.innerHTML = `
      <div class="tienda-product-card__image">
        <img src="${imageUrl}" alt="${nombre}" data-fallback="${fallbackUrl}">
      </div>
      <div class="tienda-product-card__body">
        <h3 class="tienda-product-card__title">${nombre}</h3>
        <p class="tienda-product-card__meta">${material}</p>
        <div class="tienda-product-card__footer">
          <span class="tienda-product-card__price">${formatCurrency(precio)}</span>
          <button type="button" class="tienda-product-card__btn btn-add-cart-simple" data-product-id="${product.id}">Agregar</button>
        </div>
      </div>
    `;

    const img = card.querySelector('.tienda-product-card__image img');
    if (img) {
      img.addEventListener('error', function onImgError() {
        img.removeEventListener('error', onImgError);
        const fallback = img.dataset.fallback || PLACEHOLDER_IMAGE;
        img.src = fallback;
      });
    }

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-add-cart-simple') || e.target.closest('.btn-add-cart-simple')) {
        return;
      }
      window.location.href = `producto.html?id=${product.id}`;
    });

    const addBtn = card.querySelector('.btn-add-cart-simple');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof cart !== 'undefined' && cart.addItem) {
          cart.addItem(product.id, 1);
          alert(`✅ ${nombre} agregado al carrito`);
        } else {
          alert(`✅ ${nombre} agregado al carrito`);
        }
      });
    }

    grid.appendChild(card);
  });
}

function showProductModal(product) {
  const modal = document.getElementById('productModal');
  const detail = document.getElementById('productDetail');
  detail.innerHTML = `
    <img src="${product.image}" alt="${product.name}">
    <h2>${product.name}</h2>
    <div>${product.material}</div>
    <div class="price">$${product.price}</div>
    <!-- Más info aquí -->
  `;
  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'block';
}

// Cerrar modal - solo si el elemento existe
const productCloseBtn = document.querySelector('.product-close');
if (productCloseBtn) {
  productCloseBtn.onclick = function() {
    const productModal = document.getElementById('productModal');
    if (productModal) {
      productModal.setAttribute('aria-hidden', 'true');
      productModal.style.display = 'none';
    }
  };
}

function renderFeaturedCarousel() {
  // Asegurar que los productos estén cargados
  if (PRODUCTS.length === 0) {
    console.warn('No hay productos cargados para mostrar en el carrusel');
    return;
  }
  const featured = PRODUCTS.filter(p => p.featured);
  const container = document.getElementById('featuredCarousel');
  if (!container) return;

  // Duplica los productos para el loop
  const items = [...featured, ...featured];

  container.innerHTML = '';
  const frag = document.createDocumentFragment();

  for (const p of items) {
    const item = document.createElement('article');
    item.className = 'featured-item';
    item.innerHTML = `
      <div class="card-media">
        ${p.image ? `<img class="card-bg" src="${p.image.replace(/^\//, '')}" alt="${p.name}">` : createPlaceholderSVG(p.id)}
        <div class="card-body">
          <h3>${p.name}</h3>
          <div class="price">${formatCurrency(p.price)}</div>
        </div>
        <button class="btn btn-outline featured-btn" onclick="addToCartFromFeatured('${p.id}')">Agregar al carrito</button>
      </div>
    `;
    frag.appendChild(item);
  }
  container.appendChild(frag);
}

// Función para cargar categorías desde la API y renderizarlas
async function loadCategoriesFromAPI() {
	try {
		// Esperar a que productService esté disponible
		const serviceAvailable = await waitForProductService();
		if (!serviceAvailable) {
			console.warn('productService no está disponible, usando categorías hardcodeadas');
			return false;
		}
		
		const result = await window.productService.getAllCategories();
		
		if (result.success && result.categories && result.categories.length > 0) {
			renderCategories(result.categories);
			return true;
		}
		
		return false;
	} catch (error) {
		console.error('Error al cargar categorías desde la API:', error);
		return false;
	}
}

// Función para renderizar categorías dinámicamente
function renderCategories(categories) {
	const categoriesGrid = document.querySelector('.categories-grid');
	if (!categoriesGrid) return;
	
	const categoryImages = {
		'anillos': 'assets/Categorias/anillo.png',
		'brazaletes': 'assets/Categorias/brazaletes.png',
		'collares': 'assets/Categorias/collar.png',
		'aretes': 'assets/Categorias/aretes.png',
		'broqueles': 'assets/Categorias/broqueles.png',
		'pulseras': 'assets/Categorias/pulseras.png',
		'dijes': 'assets/Categorias/dije.png',
		'conjuntos': 'assets/Categorias/conjunto.png'
	};
	const categoryDescriptions = {
		'anillos': 'Piezas únicas para tus dedos',
		'brazaletes': 'Diseños clásicos en plata',
		'collares': 'Declaraciones de estilo únicas',
		'aretes': 'Elegantes adornos para tus orejas',
		'broqueles': 'Dormilonas y broqueles artesanales',
		'pulseras': 'Accesorios para tus muñecas',
		'dijes': 'Pequeños tesoros con significado',
		'conjuntos': 'Sets coordinados'
	};
	const bentoClasses = ['bento-small', 'bento-wide', 'bento-medium', 'bento-medium', 'bento-tall', 'bento-medium', 'bento-tall', 'bento-wide-bottom'];
	const sortedCategories = [...categories].sort((a, b) => (a.orden != null ? a.orden : a.id) - (b.orden != null ? b.orden : b.id));
	const isBento = categoriesGrid.classList.contains('bento-grid');
	const description = (cat) => cat.descripcion || categoryDescriptions[cat.slug] || `Descubre ${cat.nombre.toLowerCase()}`;
	const imagePath = (cat) => categoryImages[cat.slug] || cat.imagen_icono || 'assets/placeholder.jpg';

	if (isBento) {
		categoriesGrid.innerHTML = sortedCategories.map((category, i) => {
			const bg = imagePath(category);
			const desc = description(category);
			const bentoClass = bentoClasses[i % bentoClasses.length];
			return `
				<a href="tienda?categoria=${category.slug}" class="category-card bento-item ${bentoClass} ${category.slug === 'broqueles' ? 'bento-broqueles' : ''}" data-category="${category.slug}" style="--bg: url('${bg}')">
					<span class="bento-overlay"></span>
					<span class="bento-text">
						<strong class="bento-title">${category.nombre}</strong>
						<span class="bento-subtitle">${desc}</span>
					</span>
				</a>
			`;
		}).join('');
	} else {
		categoriesGrid.innerHTML = sortedCategories.map(category => {
			const imagePathUrl = imagePath(category);
			const desc = description(category);
			return `
				<div class="category-card" data-category="${category.slug}">
					<div class="category-image">
						<div class="category-placeholder">
							<img src="${imagePathUrl}" alt="Categoría ${category.nombre}" />
						</div>
					</div>
					<div class="category-content">
						<h3>${category.nombre}</h3>
						<p>${desc}</p>
						<a href="tienda?categoria=${category.slug}" class="btn btn-primary" data-category-link="${category.slug}">Ver productos</a>
					</div>
				</div>
			`;
		}).join('');
	}
	
	// Configurar event listeners después de renderizar
	setupCategories();
}

function setupCategories() {
	const categoryCards = document.querySelectorAll('.category-card');
	console.log(`🔧 Configurando ${categoryCards.length} tarjetas de categoría`);
	
	// Usar delegación de eventos en el contenedor para evitar problemas con listeners duplicados
	const categoriesGrid = document.querySelector('.categories-grid');
	if (categoriesGrid) {
		// Remover listener anterior si existe
		categoriesGrid.removeEventListener('click', handleCategoryClick);
		categoriesGrid.addEventListener('click', handleCategoryClick);
		console.log('✅ Delegación de eventos configurada en .categories-grid');
	} else {
		// Fallback: agregar listeners individuales
		categoryCards.forEach((card) => {
			const category = card.dataset.category;
			if (!category) return;
			
			const link = card.querySelector('a.btn-primary, a[href*="categoria"]');
			if (link) {
				link.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					console.log(`🖱️ Click en categoría: ${category}`);
					window.history.pushState({ category }, '', `tienda?categoria=${category}`);
					handleCategoryView(category);
					return false;
				});
			}
			
			card.addEventListener('click', (e) => {
				if (e.target.closest('a') || e.target.closest('button')) return;
				e.preventDefault();
				e.stopPropagation();
				console.log(`🖱️ Click en tarjeta de categoría: ${category}`);
				window.history.pushState({ category }, '', `tienda?categoria=${category}`);
				handleCategoryView(category);
				return false;
			});
		});
	}
	
	// Manejar el botón "atrás" del navegador (solo una vez)
	if (!window._popstateHandlerAdded) {
		window.addEventListener('popstate', (e) => {
			const urlParams = new URLSearchParams(window.location.search);
			const categoria = urlParams.get('categoria');
			if (categoria) {
				handleCategoryView(categoria);
			} else {
				// Mostrar todas las categorías
				const categoriesSection = document.querySelector('.categories');
				const productosSection = document.getElementById('productos');
				if (categoriesSection) categoriesSection.style.display = 'block';
				if (productosSection) productosSection.style.display = 'none';
			}
		});
		window._popstateHandlerAdded = true;
	}
}

// Función para manejar clicks en categorías usando delegación de eventos
function handleCategoryClick(e) {
	// Buscar la tarjeta de categoría más cercana
	const card = e.target.closest('.category-card');
	if (!card) return;
	
	const category = card.dataset.category;
	if (!category) return;
	
	// Si el click fue en un enlace, prevenir el comportamiento por defecto
	const link = e.target.closest('a');
	if (link) {
		e.preventDefault();
		e.stopPropagation();
		console.log(`🖱️ Click en enlace de categoría: ${category}`);
		window.history.pushState({ category }, '', `tienda?categoria=${category}`);
		handleCategoryView(category);
		return false;
	}
	
	// Si el click fue en la tarjeta (pero no en un enlace)
	if (!e.target.closest('a') && !e.target.closest('button')) {
		e.preventDefault();
		e.stopPropagation();
		console.log(`🖱️ Click en tarjeta de categoría: ${category}`);
		window.history.pushState({ category }, '', `tienda?categoria=${category}`);
		handleCategoryView(category);
		return false;
	}
}

// Función para actualizar los filtros desde las categorías de la API
async function updateFiltersFromCategories() {
	try {
		const serviceAvailable = await waitForProductService();
		if (!serviceAvailable) return;
		
		const result = await window.productService.getAllCategories();
		if (!result.success || !result.categories) return;
		
		const filtersContainer = document.querySelector('.filters');
		if (!filtersContainer) return;
		
		// Ordenar categorías por orden
		const sortedCategories = [...result.categories].sort((a, b) => a.orden - b.orden);
		
		// Crear HTML de filtros dinámicamente
		let filtersHTML = '<button class="chip is-active" data-filter="all" role="tab" aria-selected="true">Todo</button>';
		
		sortedCategories.forEach(category => {
			filtersHTML += `<button class="chip" data-filter="${category.slug}" role="tab">${category.nombre}</button>`;
		});
		
		filtersContainer.innerHTML = filtersHTML;
	} catch (error) {
		console.error('Error al actualizar filtros desde categorías:', error);
	}
}

function setupFilters() {
	const chips = Array.from(document.querySelectorAll('.chip'));
	const searchInput = document.getElementById('searchInput');
	if (!chips.length || !searchInput) {
		console.warn('⚠️ No se encontraron filtros o buscador');
		return;
	}

	let active = 'all';

	function apply() {
		const term = (searchInput.value || '').toLowerCase().trim();
		console.log(`🔍 Aplicando filtros: categoría="${active}", búsqueda="${term}"`);
		console.log(`📊 Productos disponibles para filtrar: ${PRODUCTS.length}`);
		
		// Si no hay productos, no hacer nada
		if (PRODUCTS.length === 0) {
			console.warn('⚠️ No se pueden aplicar filtros porque el cache está vacío');
			return;
		}
		
		const filtered = PRODUCTS.filter(p => {
			const byCat = active === 'all' ? true : p.category === active || (p.category && p.category.toLowerCase() === active);
			const byTerm = term ? (p.name.toLowerCase().includes(term) || (p.material && p.material.toLowerCase().includes(term))) : true;
			return byCat && byTerm;
		});
		
		console.log(`✅ Productos filtrados: ${filtered.length}`);
		if (filtered.length === 0 && PRODUCTS.length > 0) {
			console.warn('⚠️ No se encontraron productos con los filtros aplicados');
			console.warn('   Categorías disponibles:', [...new Set(PRODUCTS.map(p => p.category))]);
		}
		
		// Renderizar productos (incluso si están vacíos, renderProducts manejará eso)
		renderProducts(filtered);
	}

	chips.forEach(c => {
		c.addEventListener('click', () => {
			chips.forEach(x => {
				x.classList.remove('is-active');
				x.setAttribute('aria-selected', 'false');
			});
			c.classList.add('is-active');
			c.setAttribute('aria-selected', 'true');
			active = c.dataset.filter;
			apply();
		});
	});
	searchInput.addEventListener('input', apply);
	apply();
}

// Función para manejar la vista de categoría específica
async function handleCategoryView(category) {
	console.log(`🚀 Mostrando categoría "${category}" sin recargar página`);
	
	// Ocultar la sección de categorías INMEDIATAMENTE (sin esperar)
	const categoriesSection = document.querySelector('.categories');
	if (categoriesSection) {
		categoriesSection.style.display = 'none';
	}
	
	// Ocultar el hero de la tienda original
	const shopHero = document.querySelector('.shop-hero:not(#categoryHero)');
	if (shopHero) {
		shopHero.style.display = 'none';
	}
	
	// Mostrar la sección de productos INMEDIATAMENTE (sin esperar)
	const productosSection = document.getElementById('productos');
	if (productosSection) {
		productosSection.style.display = 'block';
		console.log('✅ Sección de productos mostrada');
	} else {
		console.error('❌ No se encontró la sección de productos');
	}

	// Título de la categoría visible en todas las categorías (Anillos, Brazaletes, Pulseras, etc.)
	const CATEGORY_LABELS_VIEW = { anillos: 'Anillos', brazaletes: 'Brazaletes', collares: 'Collares', aretes: 'Aretes', broqueles: 'Broqueles', pulseras: 'Pulseras', dijes: 'Dijes', conjuntos: 'Conjuntos' };
	const titleEl = document.getElementById('productosSectionTitle');
	if (titleEl) {
		const label = CATEGORY_LABELS_VIEW[category.toLowerCase()] || (category.charAt(0).toUpperCase() + category.slice(1).toLowerCase());
		titleEl.textContent = label;
		titleEl.style.display = 'block';
		titleEl.removeAttribute('aria-hidden');
	}

	// Ocultar barra de filtros vacía para no dejar línea/espacio
	const shopControls = document.querySelector('.shop-controls');
	if (shopControls) {
		shopControls.style.display = shopControls.querySelector('.filters, .search, [class*="filter"]') ? 'flex' : 'none';
	}
	
	// Mostrar productos del cache INMEDIATAMENTE mientras se cargan desde la API
	const slugNorm = String(category).toLowerCase().trim();
	let cachedProducts = PRODUCTS.filter(p => {
		const productCategory = p.category != null ? String(p.category).toLowerCase().trim() : null;
		return productCategory === slugNorm;
	});
	
	if (cachedProducts.length > 0) {
		console.log(`⚡ Mostrando ${cachedProducts.length} productos del cache inmediatamente`);
		renderProducts(cachedProducts);
	}

	// Si el usuario dio click antes de que cargara PRODUCTS, el cache va a estar vacío.
	// En ese caso, cargamos productos y renderizamos por categoría para evitar "solo se ve la sección de categorías".
	if (cachedProducts.length === 0) {
		try {
			if (PRODUCTS.length === 0) {
				console.log('⏳ Cache vacío: cargando productos antes de renderizar categoría...');
				await loadProductsSimple();
			}

			cachedProducts = PRODUCTS.filter(p => {
				const productCategory = p.category != null ? String(p.category).toLowerCase().trim() : null;
				return productCategory === slugNorm;
			});

			if (cachedProducts.length > 0) {
				console.log(`✅ Renderizando ${cachedProducts.length} productos después de cargar cache`);
				renderProducts(cachedProducts);
			} else {
				console.warn(`⚠️ Aun así no hay productos en cache para la categoría "${category}"`);
			}
		} catch (e) {
			console.error('❌ Error cargando productos para categoría:', e);
		}
	}
	
	// Obtener el nombre de la categoría (usar mapeo hardcodeado para evitar delay)
	let categoryName = category;
	let categoryDescription = `Descubre nuestra colección de ${category}`;
	
	// Mapeo hardcodeado para evitar esperar a la API (causa delay)
	const categoryNames = {
		'anillos': 'Anillos',
		'aretes': 'Aretes',
		'collares': 'Collares',
		'pulseras': 'Pulseras',
		'conjuntos': 'Conjuntos',
		'piedras': 'Piedras'
	};
	categoryName = categoryNames[category] || category;
	categoryDescription = `Descubre nuestra colección de ${categoryName.toLowerCase()}`;
	
	// Intentar obtener información mejorada desde la API en segundo plano (sin bloquear)
	if (window.productService) {
		window.productService.getCategoryBySlug(category).then(result => {
			if (result.success && result.category) {
				// Actualizar título si se obtiene de la API
				document.title = `${result.category.nombre} – El Xolito Mex`;
				const heroTitle = document.querySelector('#categoryHero h1');
				if (heroTitle) {
					heroTitle.textContent = result.category.nombre;
				}
			}
		}).catch(() => {
			// Ignorar errores, ya tenemos el nombre hardcodeado
		});
	}
	
	document.title = `${categoryName} – El Xolito Mex`;
	
	// Crear un nuevo hero para la categoría
	const main = document.querySelector('main');
	const shopSection = document.querySelector('.shop');
	
	if (main && shopSection) {
		// Eliminar hero de categoría anterior si existe
		const existingCategoryHero = document.getElementById('categoryHero');
		if (existingCategoryHero) {
			existingCategoryHero.remove();
		}
		
		// Crear nuevo hero de categoría
		const categoryHero = document.createElement('section');
		categoryHero.id = 'categoryHero';
		// Reusar el mismo estilo del hero de tienda (font/short tagline)
		categoryHero.className = 'shop-hero shop-hero-tienda';
		categoryHero.innerHTML = `
			<div class="container">
				<p class="shop-hero-tagline">${categoryName}</p>
			</div>
		`;
		main.insertBefore(categoryHero, shopSection);
	}
	
	// Cargar productos de la categoría desde la API en segundo plano (NO bloquea)
	async function loadCategoryProducts() {
		// NO esperar a productService - si no está disponible, usar solo cache
		if (!window.productService) {
			console.warn('⚠️ productService no disponible, usando solo productos del cache');
			return;
		}
		
		try {
			console.log(`🔄 Cargando productos de "${category}" desde API...`);
			const result = await window.productService.getProductsByCategory(category);
			
			if (result.success && result.products && result.products.length > 0) {
				const filteredProducts = result.products.map(apiProduct => 
					window.productService.formatProductForFrontend(apiProduct)
				);
				console.log(`✅ Cargados ${filteredProducts.length} productos de la categoría "${category}" desde la API`);
				// Actualizar cache
				filteredProducts.forEach(p => {
					const index = PRODUCTS.findIndex(prod => prod.id === p.id);
					if (index >= 0) {
						PRODUCTS[index] = p;
					} else {
						PRODUCTS.push(p);
					}
				});
				// Actualizar productos en pantalla
				renderProducts(filteredProducts);
			} else {
				console.warn(`⚠️ No se encontraron productos en la API para la categoría "${category}"`);
			}
		} catch (error) {
			console.error('❌ Error al cargar productos por categoría desde la API:', error);
		}
	}
	
	// Cargar productos desde API en segundo plano (NO esperar - no bloquea la UI)
	loadCategoryProducts();
	
	// Scroll a la sección de productos inmediatamente
	setTimeout(() => {
		if (productosSection) {
			productosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, 100);
}

function setupNav() {
	const btn = document.querySelector('.nav-toggle');
	const list = document.querySelector('.nav-list');
	if (!btn || !list) return;

	btn.addEventListener('click', () => {
		const open = list.classList.toggle('is-open');
		btn.setAttribute('aria-expanded', String(open));
	});
	list.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
		list.classList.remove('is-open');
		btn.setAttribute('aria-expanded', 'false');
	}));
}

function setupCart() {
	console.log('setupCart called');
	const cartToggle = document.querySelector('.cart-toggle');
	const cartModal = document.getElementById('cartModal');
	const cartClose = document.querySelector('.cart-close');
	const cartOverlay = document.querySelector('.cart-overlay');

	console.log('Cart elements found - Toggle:', !!cartToggle, 'Modal:', !!cartModal);
	if (!cartToggle || !cartModal) {
		console.warn('Cart toggle or modal not found!');
		return;
	}

	cartToggle.addEventListener('click', () => {
		console.log('Cart toggle clicked');
		cartModal.setAttribute('aria-hidden', 'false');
		console.log('Cart modal aria-hidden set to false');
		document.body.style.overflow = 'hidden';
	});

	const closeCart = () => {
		cartModal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	};

	if (cartClose) cartClose.addEventListener('click', closeCart);
	if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

	// Close on escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && cartModal.getAttribute('aria-hidden') === 'false') {
			closeCart();
		}
	});
}

// Auth Modal Functions
window.openLoginModal = function () {
	console.log('openLoginModal called');
	const modal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	console.log('Login modal found:', !!modal);
	if (modal) {
		modal.setAttribute('aria-hidden', 'false');
		console.log('Login modal aria-hidden set to false');
		if (registerModal) {
			registerModal.setAttribute('aria-hidden', 'true');
		}
		document.body.style.overflow = 'hidden';
	} else {
		console.error('Login modal not found!');
	}
};

// Abrir modal de registro
window.openRegisterModal = function () {
	console.log('openRegisterModal called');
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	console.log('Register modal found:', !!registerModal);
	if (registerModal) {
		registerModal.setAttribute('aria-hidden', 'false');
		console.log('Register modal aria-hidden set to false');
		if (loginModal) {
			loginModal.setAttribute('aria-hidden', 'true');
		}
		document.body.style.overflow = 'hidden';
	} else {
		console.error('Register modal not found!');
	}
};

function closeAuthModal() {
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	if (loginModal) loginModal.setAttribute('aria-hidden', 'true');
	if (registerModal) registerModal.setAttribute('aria-hidden', 'true');
	document.body.style.overflow = '';
}

// Cambiar entre login y registro desde los enlaces
window.switchToRegister = function() {
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	if (loginModal && registerModal) {
		loginModal.setAttribute('aria-hidden', 'true');
		registerModal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
	}
};

window.switchToLogin = function() {
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	if (loginModal && registerModal) {
		registerModal.setAttribute('aria-hidden', 'true');
		loginModal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
	}
};

// El cierre de modales se maneja en setupAuthModals()

// Authentication functionality

// Función para crear botón de mostrar/ocultar contraseña
function createPasswordToggle(inputId) {
	const input = document.getElementById(inputId);
	if (!input || input.type !== 'password') return;

	// Verificar si ya existe un toggle
	if (input.parentElement.querySelector('.password-toggle')) return;

	const toggle = document.createElement('button');
	toggle.type = 'button';
	toggle.className = 'password-toggle';
	toggle.setAttribute('aria-label', 'Mostrar contraseña');
	toggle.innerHTML = '👁️';
	toggle.style.cssText = `
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		font-size: 18px;
		padding: 5px;
		color: #666;
		z-index: 10;
	`;

	// Hacer el contenedor relativo si no lo es
	const formGroup = input.closest('.form-group');
	if (formGroup) {
		formGroup.style.position = 'relative';
	}

	toggle.addEventListener('click', () => {
		if (input.type === 'password') {
			input.type = 'text';
			toggle.innerHTML = '🙈';
			toggle.setAttribute('aria-label', 'Ocultar contraseña');
		} else {
			input.type = 'password';
			toggle.innerHTML = '👁️';
			toggle.setAttribute('aria-label', 'Mostrar contraseña');
		}
	});

	input.parentElement.appendChild(toggle);
}

function showAuthMessage(message, type = 'success') {
	// Create or get existing message container
	let messageContainer = document.getElementById('authMessage');
	if (!messageContainer) {
		messageContainer = document.createElement('div');
		messageContainer.id = 'authMessage';
		messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: "GFS Didot", serif;
      font-weight: 500;
      z-index: 10000;
      transition: all 0.3s ease;
    `;
		document.body.appendChild(messageContainer);
	}

	// Set message and styling based on type
	messageContainer.textContent = message;
	if (type === 'success') {
		messageContainer.style.backgroundColor = '#d4edda';
		messageContainer.style.color = '#155724';
		messageContainer.style.border = '1px solid #c3e6cb';
	} else {
		messageContainer.style.backgroundColor = '#f8d7da';
		messageContainer.style.color = '#721c24';
		messageContainer.style.border = '1px solid #f5c6cb';
	}

	// Show and auto-hide after 3 seconds
	messageContainer.style.display = 'block';
	setTimeout(() => {
		if (messageContainer.parentNode) {
			messageContainer.style.display = 'none';
		}
	}, 3000);
}

async function handleLogin(event) {
	event.preventDefault();

	const email = document.getElementById('loginEmail').value;
	const password = document.getElementById('loginPassword').value;

	// Basic validation
	if (!email || !password) {
		showAuthMessage('Por favor, completa todos los campos', 'error');
		return;
	}

	if (!isValidEmail(email)) {
		showAuthMessage('Por favor, ingresa un email válido', 'error');
		return;
	}

	const loginButton = event.target.querySelector('button[type="submit"]');
	const originalButtonText = loginButton.textContent;
	loginButton.disabled = true;
	loginButton.textContent = 'Iniciando sesión...';

	try {
		// Llamar a la API real
		const result = await window.authService.login(email, password);

		if (result.success) {
			// Update UI
			updateAuthUI(true, result.user);

			// Close modal
			closeAuthModal();

			// Reset form
			event.target.reset();

			// Show success message
			const displayName = result.user.nombre_completo || result.user.name || result.user.email.split('@')[0];
			showAuthMessage(`¡Bienvenido de vuelta, ${displayName}!`);
		} else {
			// Mostrar error específico del backend
			const errorMessage = result.message || 'Error al iniciar sesión';
			showAuthMessage(errorMessage, 'error');
		}
	} catch (error) {
		console.error('Error en login:', error);
		// Detectar si es error de red
		if (error.message && error.message.includes('fetch')) {
			showAuthMessage('Error al conectar con el servidor. Verifica que el backend esté corriendo.', 'error');
		} else {
			showAuthMessage(error.message || 'Error al iniciar sesión. Intenta nuevamente.', 'error');
		}
	} finally {
		// Reset button
		loginButton.disabled = false;
		loginButton.textContent = originalButtonText;
	}
}

async function handleRegister(event) {
	event.preventDefault();

	const nombre_completo = document.getElementById('registerName').value;
	const email = document.getElementById('registerEmail').value;
	const password = document.getElementById('registerPassword').value;
	const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
	const telefono = document.getElementById('registerTelefono')?.value || null;

	// Basic validation
	if (!nombre_completo || !email || !password) {
		showAuthMessage('Por favor, completa todos los campos obligatorios', 'error');
		return;
	}

	if (!isValidEmail(email)) {
		showAuthMessage('Por favor, ingresa un email válido', 'error');
		return;
	}

	// Validación de contraseña más estricta
	if (password.length < 8) {
		showAuthMessage('La contraseña debe tener al menos 8 caracteres', 'error');
		return;
	}

	if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
		showAuthMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número', 'error');
		return;
	}

	// Validar confirmación de contraseña
	if (confirmPassword && password !== confirmPassword) {
		showAuthMessage('Las contraseñas no coinciden', 'error');
		return;
	}

	const registerButton = event.target.querySelector('button[type="submit"]');
	registerButton.disabled = true;
	registerButton.textContent = 'Creando cuenta...';

	try {
		// Llamar a la API
		const result = await window.authService.register(email, password, nombre_completo, telefono);

		if (result.success) {
			// Update UI
			updateAuthUI(true, result.user);

			// Close modal
			closeAuthModal();

			// Reset form
			event.target.reset();

			// Show success message
			const displayName = result.user.nombre_completo || result.user.name || result.user.email.split('@')[0];
			showAuthMessage(`¡Cuenta creada exitosamente! Bienvenido, ${displayName}!`);
			
			// Redirigir a página de perfil después de 1.5 segundos
			setTimeout(() => {
				window.location.href = 'mi-cuenta.html';
			}, 1500);
		} else {
			showAuthMessage(result.message || 'Error al registrar usuario', 'error');
		}
	} catch (error) {
		console.error('Error en registro:', error);
		showAuthMessage('Error al conectar con el servidor. Verifica que el backend esté corriendo.', 'error');
	} finally {
		// Reset button
		registerButton.disabled = false;
		registerButton.textContent = 'Crear Cuenta';
	}
}

async function handleLogout() {
	try {
		// Cerrar sesión en el servidor
		await window.authService.logout();
	} catch (error) {
		console.error('Error al cerrar sesión:', error);
	}

	// Update UI
	updateAuthUI(false);

	// Show message
	showAuthMessage('Has cerrado sesión exitosamente');
}

// Función para mostrar modal de recuperación de contraseña
function showForgotPassword() {
	closeAuthModal();
	// Por ahora, mostrar un mensaje informativo
	// En el futuro, esto puede abrir un modal específico para recuperación
	showAuthMessage('Funcionalidad de recuperación de contraseña próximamente disponible. Contacta al administrador.', 'error');
	// TODO: Implementar modal y endpoints de recuperación de contraseña cuando el backend esté listo
}

function updateAuthUI(isLoggedIn, userData = null) {
	const authButtons = document.querySelector('.auth-buttons') || document.getElementById('authButtonsContainer');
	const profileToggle = document.getElementById('profileToggle');
	
	// Siempre ocultar los botones de auth (se muestran en el modal cuando se hace clic en el icono de perfil)
	if (authButtons) {
		authButtons.style.display = 'none';
	}
	
	if (isLoggedIn && userData) {
		// Usuario autenticado: icono de perfil va a mi-cuenta
		if (profileToggle) {
			profileToggle.onclick = () => {
				window.location.href = 'mi-cuenta.html';
			};
		}
	} else {
		// Usuario no autenticado: icono de perfil abre modal de login
		if (profileToggle) {
			profileToggle.onclick = () => {
				openLoginModal();
			};
		}
	}
}

function showUserProfile() {
	window.location.href = 'mi-cuenta.html';
}

function showUserOrders() {
	window.location.href = 'mi-cuenta.html';
}

function setupAuthButtons() {
	const btnLogin = document.getElementById('btnLogin');
	const btnRegister = document.getElementById('btnRegister');
	
	if (btnLogin) {
		btnLogin.addEventListener('click', (e) => {
			e.preventDefault();
			openLoginModal();
		});
	}
	
	if (btnRegister) {
		btnRegister.addEventListener('click', (e) => {
			e.preventDefault();
			openRegisterModal();
		});
	}
}

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

async function checkAuthStatus() {
	// Verificar si hay token y usuario en localStorage
	const token = localStorage.getItem('accessToken');
	const userStr = localStorage.getItem('currentUser');
	
	if (token && userStr) {
		try {
			// Verificar con el servidor que el token sigue siendo válido
			const user = await window.authService.getCurrentUser();
			if (user) {
				updateAuthUI(true, user);
			} else {
				// Token inválido, limpiar
				await window.authService.logout();
				updateAuthUI(false);
			}
		} catch (e) {
			console.error('Error al verificar autenticación:', e);
			await window.authService.logout();
			updateAuthUI(false);
		}
	} else {
		updateAuthUI(false);
	}
}

// Setup Auth Modals
function setupAuthModals() {
	console.log('setupAuthModals called');
	const loginModal = document.getElementById('loginModal');
	const registerModal = document.getElementById('registerModal');
	console.log('Modals found - Login:', !!loginModal, 'Register:', !!registerModal);

	// Usar event delegation en el contenedor de botones de autenticación
	// Esto funciona incluso si los botones se reemplazan dinámicamente
	const authButtonsContainer = document.querySelector('.auth-buttons');
	console.log('Auth buttons container found:', !!authButtonsContainer);
	if (authButtonsContainer) {
		authButtonsContainer.addEventListener('click', (e) => {
			console.log('Auth button clicked:', e.target);
			const target = e.target.closest('button');
			if (!target) {
				console.log('No button found in click target');
				return;
			}
			console.log('Button found:', target.id, target.textContent);
			
			// Verificar si es el botón de login (por ID, clase, o texto)
			if (target.id === 'btnLogin' || 
			    target.textContent.includes('Iniciar Sesión') ||
			    target.getAttribute('onclick')?.includes('openLoginModal')) {
				e.preventDefault();
				e.stopPropagation();
				console.log('Opening login modal');
				openLoginModal();
			}
			// Verificar si es el botón de registro
			else if (target.id === 'btnRegister' || 
			         target.textContent.includes('Registrarse') ||
			         target.getAttribute('onclick')?.includes('openRegisterModal')) {
				e.preventDefault();
				e.stopPropagation();
				console.log('Opening register modal');
				openRegisterModal();
			}
		});
	}

	// También conectar directamente los botones originales si existen
	const btnLogin = document.getElementById('btnLogin');
	const btnRegister = document.getElementById('btnRegister');
	console.log('Direct buttons found - Login:', !!btnLogin, 'Register:', !!btnRegister);
	
	if (btnLogin) {
		btnLogin.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('Direct login button clicked');
			openLoginModal();
		});
	}
	
	if (btnRegister) {
		btnRegister.addEventListener('click', (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('Direct register button clicked');
			openRegisterModal();
		});
	}

	// Conectar formularios
	if (loginModal) {
		const closeBtn = loginModal.querySelector('.auth-close');
		const overlay = loginModal.querySelector('.auth-overlay');
		const form = loginModal.querySelector('.auth-form');
		
		if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
		if (overlay) overlay.addEventListener('click', closeAuthModal);
		if (form) form.addEventListener('submit', handleLogin);
		
		// Agregar toggle de contraseña para login
		setTimeout(() => {
			createPasswordToggle('loginPassword');
		}, 100);
	}

	if (registerModal) {
		const closeBtn = registerModal.querySelector('.auth-close');
		const overlay = registerModal.querySelector('.auth-overlay');
		const form = registerModal.querySelector('.auth-form');
		
		if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
		if (overlay) overlay.addEventListener('click', closeAuthModal);
		if (form) form.addEventListener('submit', handleRegister);
		
		// Agregar toggles de contraseña para registro
		setTimeout(() => {
			createPasswordToggle('registerPassword');
			createPasswordToggle('registerConfirmPassword');
		}, 100);
	}

	// Close on escape key
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			const loginModal = document.getElementById('loginModal');
			const registerModal = document.getElementById('registerModal');
			if (loginModal && loginModal.getAttribute('aria-hidden') === 'false') {
				closeAuthModal();
			}
			if (registerModal && registerModal.getAttribute('aria-hidden') === 'false') {
				closeAuthModal();
			}
		}
	});
	
	// El icono de perfil se configura en updateAuthUI según el estado de autenticación

	// Verificar estado de autenticación DESPUÉS de configurar los listeners
	// Esto asegura que los botones reemplazados también funcionen gracias a event delegation
	checkAuthStatus();
}

function setupYear() {
	const yearEl = document.getElementById('year');
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function setupHashNavigation() {
	// Solo hacer scroll automático si hay un hash y no es el footer
	if (location.hash && location.hash !== '#contacto' && location.hash !== '#footer') {
		setTimeout(() => {
		const target = document.querySelector(location.hash);
			if (target && !target.closest('footer')) {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}, 100);
	}
	document.querySelectorAll('a[href^="#"]').forEach(link => {
		link.addEventListener('click', (e) => {
			const id = link.getAttribute('href');
			if (!id || id === '#') return;
			const el = document.querySelector(id);
			if (el && !el.closest('footer')) {
				e.preventDefault();
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
				history.pushState(null, '', id);
			}
		});
	});
}

async function main() {
	console.log('main() function called');
	setupNav();
	setupCart();
	setupAuthModals();
	setupYear();
	setupHashNavigation();
	
	// En la tienda no esperamos a productService: los productos se cargan con loadProductsSimple() (fetch directo).
	// Solo en home (y otras páginas con carrusel) pre-cargamos vía loadProductsFromAPI para no bloquear la tienda.
	if (!document.getElementById('productGrid')) {
		console.log('🔄 Iniciando carga de productos (página principal)...');
		const loadedProducts = await loadProductsFromAPI();
		console.log(`📦 Productos en cache después de carga: ${PRODUCTS.length}`);
		if (PRODUCTS.length === 0) {
			console.warn('⚠️ No hay productos desde la API, usando productos de ejemplo');
			PRODUCTS = EXAMPLE_PRODUCTS.map(p => window.productService && window.productService.formatProductForFrontend ? window.productService.formatProductForFrontend(p) : { id: p.id, name: p.nombre, price: p.precio, material: p.material, image: p.image, category: p.categoria_slug, imagenes: p.imagenes, color: p.color });
		} else {
			console.log(`✅ ${PRODUCTS.length} productos cargados exitosamente`);
		}
		if (PRODUCTS.length > 0) {
			renderFeaturedCarousel();
		}
	}
	console.log('main() function completed');

	// Check if we're on the product page
	if (document.getElementById('productContent')) {
		await renderProductPage();
		return; // Exit early, don't run other setup functions
	}

	// Check if we're on the shop page
	if (document.getElementById('productGrid')) {
		console.log('🏪 Página de tienda detectada - Cargando productos con diseño nuevo');

		// 1) Leer URL y aplicar vista de categoría INMEDIATAMENTE (sin esperar nada)
		//    Así nunca se ve bento + productos debajo; si hay ?categoria= solo se ve el grid.
		const urlParams = new URLSearchParams(window.location.search);
		const categoria = urlParams.get('categoria');
		const filterParam = urlParams.get('filter');
		const productId = urlParams.get('id');
		const activeCategoryParam = categoria || filterParam;

		const CATEGORY_LABELS = { anillos: 'Anillos', brazaletes: 'Brazaletes', collares: 'Collares', aretes: 'Aretes', broqueles: 'Broqueles', pulseras: 'Pulseras', dijes: 'Dijes', conjuntos: 'Conjuntos' };
		const productosSectionTitleEl = document.getElementById('productosSectionTitle');

		if (activeCategoryParam) {
			const productosSection = document.getElementById('productos');
			if (productosSection) productosSection.style.display = 'block';
			const categoriesSection = document.querySelector('.categories');
			if (categoriesSection) categoriesSection.style.display = 'none';
			const shopHeroTienda = document.querySelector('.shop-hero-tienda');
			if (shopHeroTienda) shopHeroTienda.style.display = 'none';
		}
		if (productosSectionTitleEl) {
			if (activeCategoryParam) {
				const label = CATEGORY_LABELS[activeCategoryParam.toLowerCase()] || activeCategoryParam.charAt(0).toUpperCase() + activeCategoryParam.slice(1).toLowerCase();
				productosSectionTitleEl.textContent = label;
				productosSectionTitleEl.style.display = 'block';
				productosSectionTitleEl.removeAttribute('aria-hidden');
			} else {
				productosSectionTitleEl.style.display = 'none';
				productosSectionTitleEl.setAttribute('aria-hidden', 'true');
			}
		}

		// 2) Configurar clicks de categorías con el HTML estático (no esperar a la API de categorías)
		setupCategories();

		// 3) Cargar productos (siempre, para tener cache al hacer click en una categoría)
		console.log('🔄 Cargando productos desde la API para mostrar...');
		let products = await loadProductsSimple();

		// 4) Solo mostrar el grid cuando hay categoría en la URL. Sin categoría = solo bento, sin productos debajo.
		if (!activeCategoryParam) {
			const productosSection = document.getElementById('productos');
			if (productosSection) productosSection.style.display = 'none';
		} else {
			// Filtrar por categoría
			if (products.length > 0) {
				const slugNorm = String(activeCategoryParam).toLowerCase().trim();
				const filteredProducts = products.filter(p => {
					const pc = p.categoria_slug || p.categoria || p.category;
					return pc != null && String(pc).toLowerCase().trim() === slugNorm;
				});
				if (filteredProducts.length > 0) {
					console.log(`✅ ${filteredProducts.length} productos filtrados por categoría "${activeCategoryParam}"`);
					products = filteredProducts;
				} else {
					console.warn(`⚠️ No se encontraron productos para la categoría "${activeCategoryParam}"`);
				}
			}

			if (products.length > 0) {
				console.log(`✅ ${products.length} productos cargados, renderizando con diseño nuevo...`);
				renderProductsSimple(products);
				const productosSection = document.getElementById('productos');
				if (productosSection) {
					productosSection.style.display = 'block';
					const categoriesSection = document.querySelector('.categories');
					if (categoriesSection) categoriesSection.style.display = 'none';
					setTimeout(() => productosSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
				}
			} else {
				const grid = document.getElementById('productGrid');
				const productosSection = document.getElementById('productos');
				if (productosSection) productosSection.style.display = 'block';
				if (grid) grid.innerHTML = '<p class="tienda-empty">No se encontraron productos para esta categoría.</p>';
			}
		}

		// Categorías desde la API en segundo plano (no bloquea la carga de productos)
		loadCategoriesFromAPI().then(function (categoriesLoaded) {
			if (categoriesLoaded) {
				setTimeout(setupCategories, 50);
			}
		});
		
		// Abrir modal de producto si hay ID en la URL
		if (productId) {
			// Wait for products to render, then open the product modal
			setTimeout(async () => {
				let product = PRODUCTS.find(p => p.id === productId);
				if (!product) {
					product = await getProductById(productId);
				}
				if (product) {
					await openProductDetail(productId);
				}
			}, 500);
		}
	}

	// Check if we're on the home page - inicializar carrusel de piezas destacadas
	const carouselElement = document.querySelector('.piezas-des-carousel');
	console.log('🔍 Buscando carrusel en la página:', !!carouselElement);
	if (carouselElement) {
		console.log('✅ Carrusel encontrado, llamando setupPiezasDestacadasCarousel()');
		setupPiezasDestacadasCarousel();
	} else {
		console.warn('⚠️ Carrusel no encontrado en la página');
	}
  
  // Setup product modal events
  setupProductModal();
}

function setupProductModal() {
  const modal = document.getElementById('productModal');
  if (!modal) return;

  // Cerrar al hacer click en el overlay
  const overlay = modal.querySelector('.product-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeProductModal);
  }

  // Cerrar al hacer click en el botón de cerrar
  const closeBtn = modal.querySelector('.product-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeProductModal);
  }

  // Cerrar con la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeProductModal();
    }
  });
}
// Ejecutar main cuando el DOM esté listo Y productService esté disponible
// Con type="module", el script se ejecuta después de que el DOM esté parseado
// pero antes de que las imágenes y otros recursos estén cargados
console.log('📄 Script main.js cargado, readyState:', document.readyState);
console.log('🔍 productService disponible al cargar main.js:', typeof window.productService !== 'undefined');

// Función para ejecutar main de forma segura
async function executeMain() {
	try {
		// Esperar a que productService esté disponible (máximo 2 segundos)
		if (!window.productService) {
			console.log('⏳ Esperando a que productService se cargue...');
			
			// Escuchar el evento personalizado
			const serviceReady = new Promise((resolve) => {
				const timeout = setTimeout(() => {
					document.removeEventListener('productServiceReady', handler);
					resolve(false);
				}, 2000);
				
				const handler = () => {
					clearTimeout(timeout);
					document.removeEventListener('productServiceReady', handler);
					resolve(true);
				};
				
				document.addEventListener('productServiceReady', handler);
				
				// También verificar periódicamente por si el evento ya se disparó
				const checkInterval = setInterval(() => {
					if (window.productService) {
						clearInterval(checkInterval);
						clearTimeout(timeout);
						document.removeEventListener('productServiceReady', handler);
						resolve(true);
					}
				}, 100);
			});
			
			await serviceReady;
		}
		
		console.log('🚀 Ejecutando main()...');
		console.log('   productService disponible:', typeof window.productService !== 'undefined');
		await main();
	} catch (error) {
		console.error('❌ Error al ejecutar main():', error);
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		console.log('✅ DOMContentLoaded fired, calling main()');
		executeMain();
	});
} else {
	// DOM ya está listo, ejecutar inmediatamente
	console.log('✅ DOM already ready, calling main() immediately');
	executeMain();
}

// También intentar ejecutar después de un pequeño delay por si acaso
setTimeout(() => {
	console.log('🔄 Timeout ejecutado, verificando carrusel...');
	const carousel = document.querySelector('.piezas-des-carousel');
	console.log('Carrusel en timeout:', !!carousel);
	console.log('setupPiezasDestacadasCarousel existe:', typeof setupPiezasDestacadasCarousel);
	if (carousel && typeof setupPiezasDestacadasCarousel === 'function') {
		console.log('🔄 Reintentando inicializar carrusel después de delay...');
		setupPiezasDestacadasCarousel();
	} else {
		console.error('❌ No se puede inicializar carrusel:', {
			carousel: !!carousel,
			functionExists: typeof setupPiezasDestacadasCarousel === 'function'
		});
	}
}, 500);

// Blog Modal Functions
window.openBlogModal = function (id) {
	const modal = document.getElementById(id);
	if (modal) {
		modal.setAttribute('aria-hidden', 'false');
		document.body.style.overflow = 'hidden';
	}
};
window.closeBlogModal = function (id) {
	const modal = document.getElementById(id);
	if (modal) {
		modal.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
	}
};

// Función para inicializar el carrusel de piezas destacadas
window.setupPiezasDestacadasCarousel = function setupPiezasDestacadasCarousel() {
	console.log('🔧 setupPiezasDestacadasCarousel() llamado');
	const carousel = document.querySelector('.piezas-des-carousel');
	console.log('Carrusel encontrado:', !!carousel);
	if (!carousel) {
		console.error('❌ Carrusel no encontrado!');
		return; // Si no existe el carrusel, salir
	}
	
	const slidesContainer = document.querySelector('#featuredCarousel');
	const slides = document.querySelectorAll('.piezas-des-slide');
	const dotsContainer = document.querySelector('.piezas-des-dots');
	
	console.log('Elementos encontrados:', {
		slidesContainer: !!slidesContainer,
		slides: slides.length,
		dotsContainer: !!dotsContainer
	});
	
	if (!slidesContainer || !slides.length || !dotsContainer) {
		console.error('❌ Elementos del carrusel no encontrados:', {
			slidesContainer: !!slidesContainer,
			slides: slides.length,
			dotsContainer: !!dotsContainer
		});
		return;
	}
	
	const totalSlides = slides.length;
	console.log('✅ Todos los elementos encontrados, inicializando carrusel con', totalSlides, 'slides...');
	
	let currentSlide = 0;
	let autoSlideInterval;
	
	// Crear puntos de navegación
	dotsContainer.innerHTML = ''; // Limpiar puntos existentes
	for (let i = 0; i < totalSlides; i++) {
		const dot = document.createElement('div');
		dot.classList.add('piezas-des-dot');
		if (i === 0) dot.classList.add('active');
		dot.addEventListener('click', () => goToSlide(i));
		dotsContainer.appendChild(dot);
	}
	
	const dots = document.querySelectorAll('.piezas-des-dot');
	
	// Función para ir a una diapositiva específica
	function goToSlide(slideIndex) {
		currentSlide = slideIndex;
		updateCarousel();
		resetAutoSlide(); // Reiniciar el autoavance cuando se navega manualmente
	}
	
	// Función para actualizar el carrusel
	function updateCarousel() {
		slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
		
		// Actualizar puntos activos
		dots.forEach((dot, index) => {
			dot.classList.toggle('active', index === currentSlide);
		});
	}
	
	// Función para avanzar al siguiente slide
	function nextSlide() {
		currentSlide = (currentSlide + 1) % totalSlides;
		updateCarousel();
	}
	
	// Función para retroceder al slide anterior
	function prevSlide() {
		currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
		updateCarousel();
	}
	
	// Función para iniciar el autoavance
	function startAutoSlide() {
		if (autoSlideInterval) clearInterval(autoSlideInterval);
		autoSlideInterval = setInterval(nextSlide, 4000); // Cambia cada 4 segundos
	}
	
	// Función para detener el autoavance
	function stopAutoSlide() {
		if (autoSlideInterval) {
			clearInterval(autoSlideInterval);
			autoSlideInterval = null;
		}
	}
	
	// Función para reiniciar el autoavance
	function resetAutoSlide() {
		stopAutoSlide();
		startAutoSlide();
	}
	
	// Eventos para las flechas - REMOVIDO (ya no existen las flechas)
	
	// Pausar autoavance al pasar el mouse
	carousel.addEventListener('mouseenter', stopAutoSlide);
	carousel.addEventListener('mouseleave', startAutoSlide);
	
	// Navegación con teclado (solo cuando el carrusel está visible)
	carousel.addEventListener('keydown', (e) => {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prevSlide();
			resetAutoSlide();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			nextSlide();
			resetAutoSlide();
		}
	});
	
	// Inicializar posición
	updateCarousel();
	
	// Iniciar autoavance al cargar la página
	startAutoSlide();
	
	console.log('✅ Carrusel inicializado correctamente con', totalSlides, 'slides');
}

// Cambiar entre login y registro desde los enlaces (ya definido arriba)

// --- Login con Google ---
window.onload = function() {
  const googleLoginButton = document.getElementById("googleLoginModal");
  const googleRegisterButton = document.getElementById("googleRegisterModal");

  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: "TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        google.accounts.id.prompt(); // muestra la ventana emergente
      }
    });
  }
  
  if (googleRegisterButton) {
    googleRegisterButton.addEventListener("click", () => {
      if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
          client_id: "TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com",
          callback: handleCredentialResponse
        });
        google.accounts.id.prompt(); // muestra la ventana emergente
      }
    });
  }
};

// Manejar la respuesta de Google
function handleCredentialResponse(response) {
  // Decodificar el JWT para obtener datos del usuario
  const data = parseJwt(response.credential);
  console.log("Usuario autenticado con Google:", data);

  alert(`¡Hola, ${data.name}! Has iniciado sesión con Google`);
}

// Decodificador JWT simple
function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(jsonPayload);
}
// Botones de Apple
const appleLoginButton = document.getElementById("appleLoginModal");
const appleRegisterButton = document.getElementById("appleRegisterModal");

if (appleLoginButton) {
  appleLoginButton.addEventListener("click", () => {
    alert("Inicio con Apple disponible próximamente 🍎");
  });
}

if (appleRegisterButton) {
  appleRegisterButton.addEventListener("click", () => {
    alert("Inicio con Apple disponible próximamente 🍎");
  });
}


async function openProductDetail(productId) {
  console.log('Abriendo producto:', productId); // Para debug
  let product = PRODUCTS.find(p => p.id === productId);
  
  // Si no está en cache, cargarlo desde la API
  if (!product) {
    product = await getProductById(productId);
  }
  
  if (!product) {
    console.error('Producto no encontrado:', productId);
    return;
  }

  const modal = document.getElementById('productModal');
  const detail = document.getElementById('productDetail');

  if (!modal || !detail) {
    console.error('Modal no encontrado en el DOM');
    return;
  }

  detail.innerHTML = `
    <div class="product-detail-container">
      <div class="product-detail-image">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIyMDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4='">
      </div>
      <div class="product-detail-info">
        <h2>${product.name}</h2>
        <div class="product-price">${formatCurrency(product.price)}</div>
        
        <div class="product-meta">
          <div class="meta-item">
            <strong>Material:</strong>
            <span>${product.material}</span>
          </div>
          <div class="meta-item">
            <strong>Color:</strong>
            <span>${product.color || '—'}</span>
          </div>
          <div class="meta-item">
            <strong>Categoría:</strong>
            <span>${(product.category || product.categoria_nombre || '').charAt(0).toUpperCase() + (product.category || product.categoria_nombre || '').slice(1)}</span>
          </div>
          <div class="meta-item">
            <strong>SKU:</strong>
            <span>${product.id}</span>
          </div>
        </div>

        <div class="product-options">
          <div class="quantity-selector">
            <label for="productQuantity">Cantidad:</label>
            <div class="qty-controls">
              <button type="button" onclick="decreaseQuantity()">-</button>
              <input type="number" id="productQuantity" value="1" min="1" max="10">
              <button type="button" onclick="increaseQuantity()">+</button>
            </div>
          </div>
        </div>

        <div class="product-features">
          <div class="feature">
            <span class="feature-icon">🚚</span>
            <span>Envío gratis en compras mayores a $879</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🔒</span>
            <span>Pago seguro</span>
          </div>
          <div class="feature">
            <span class="feature-icon">↩️</span>
            <span>Devoluciones en 30 días</span>
          </div>
        </div>

        <div class="product-actions">
          <button class="btn btn-primary btn-full" onclick="addToCartFromDetail('${product.id}')">
            Añadir al carrito
          </button>
          <button class="btn btn-outline btn-full" onclick="addToCartAndCheckout('${product.id}')">
            Comprar ahora
          </button>
        </div>
      </div>
    </div>
  `;

  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  
  // Guardar el producto actual para usar en las funciones de cantidad
  window.currentProductId = productId;
}


// Funciones auxiliares para controlar la cantidad (modal de producto)
window.increaseQuantity = function() {
  const quantityInput = document.getElementById('productQuantity');
  if (!quantityInput) return;
  
  const currentValue = parseInt(quantityInput.value);
  if (currentValue < 10) {
    quantityInput.value = currentValue + 1;
  }
};

window.decreaseQuantity = function() {
  const quantityInput = document.getElementById('productQuantity');
  if (!quantityInput) return;
  
  const currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
};

// Función para añadir al carrito desde el detalle (modal)
window.addToCartFromDetail = async function(productId) {
  const quantityInput = document.getElementById('productQuantity');
  if (!quantityInput) return;
  
  const quantity = parseInt(quantityInput.value) || 1;
  cart.addItem(productId, quantity);
  closeProductModal();
  
  // Mostrar mensaje de confirmación
  showAddToCartMessage(productId, quantity);
};

// Función para añadir y proceder al checkout (modal)
window.addToCartAndCheckout = function(productId) {
  const quantityInput = document.getElementById('productQuantity');
  if (!quantityInput) return;
  
  const quantity = parseInt(quantityInput.value) || 1;
  cart.addItem(productId, quantity);
  closeProductModal();
  
  // Abrir el carrito después de un pequeño delay para que se actualice
  setTimeout(() => {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      cartModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }, 100);
};

// Mensaje de confirmación al añadir al carrito

function showAddToCartMessage(productId, quantity) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  let messageContainer = document.getElementById('addToCartMessage');
  if (!messageContainer) {
    messageContainer = document.createElement('div');
    messageContainer.id = 'addToCartMessage';
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 8px;
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      font-family: "GFS Didot", serif;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-width: 300px;
      transition: all 0.3s ease;
    `;
    document.body.appendChild(messageContainer);
  }

  messageContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="color: #28a745; font-size: 1.2rem;">✓</span>
      <div>
        <strong style="display: block; margin-bottom: 4px;">¡Producto añadido!</strong>
        ${quantity}x ${product.name} - ${formatCurrency(product.price * quantity)}
      </div>
    </div>
  `;

  messageContainer.style.display = 'block';
  messageContainer.style.opacity = '1';
  
  setTimeout(() => {
    if (messageContainer.parentNode) {
      messageContainer.style.opacity = '0';
      setTimeout(() => {
        messageContainer.style.display = 'none';
      }, 300);
    }
  }, 3000);
}


// Solo agregar event listeners si los elementos existen (página de tienda con modal)
const productClose = document.querySelector('.product-close');
const productOverlay = document.querySelector('.product-overlay');
if (productClose) {
  productClose.addEventListener('click', closeProductModal);
}
if (productOverlay) {
  productOverlay.addEventListener('click', closeProductModal);
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

// Función para renderizar la página de producto individual
async function renderProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  
  if (!productId) {
    // Si no hay ID, redirigir a la tienda
    window.location.href = 'tienda';
    return;
  }

  const productContent = document.getElementById('productContent');
  
  // Mostrar loading mientras se carga el producto
  productContent.innerHTML = `
    <div style="text-align: center; padding: 4rem 2rem;">
      <p>Cargando producto...</p>
    </div>
  `;
  
  // Intentar obtener el producto desde cache o API
  let product = PRODUCTS.find(p => p.id === productId);
  
  if (!product) {
    product = await getProductById(productId);
  }
  
  if (!product) {
    // Producto no encontrado
    productContent.innerHTML = `
      <div style="text-align: center; padding: 4rem 2rem;">
        <h2>Producto no encontrado</h2>
        <p>El producto que buscas no está disponible.</p>
        <a href="tienda" class="btn btn-primary" style="margin-top: 1rem;">Volver a la tienda</a>
      </div>
    `;
    return;
  }

  // Actualizar el título de la página
  document.title = `${product.name} – El Xolito Mex`;

  // Obtener imágenes del producto (desde API o usar la imagen principal)
  let productImages = [];
  if (product.imagenes && product.imagenes.length > 0) {
    productImages = product.imagenes.map(img => img.ruta);
  } else {
    // Fallback: usar la imagen principal
    productImages = [product.image || 'assets/placeholder.jpg'];
  }

  // Renderizar el producto completo
  productContent.innerHTML = `
    <div class="product-page-container">
      <div class="product-page-gallery">
        <div class="product-page-image-main">
          <img id="mainProductImage" src="${productImages[0]}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIyMDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4='">
        </div>
        <div class="product-page-thumbnails">
          ${productImages.map((img, index) => `
            <div class="product-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', ${index})">
              <img src="${img}" alt="${product.name} - Vista ${index + 1}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIyMDAiIHk9IjIwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4Ij5JbWFnZW4gbm8gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4='">
            </div>
          `).join('')}
        </div>
      </div>
      <div class="product-page-info">
        <h1 class="product-page-title">${product.name}</h1>
        <div class="product-page-price">${formatCurrency(product.price)}</div>
        
        <div class="product-page-meta">
          <div class="meta-item">
            <strong>Material:</strong>
            <span>${product.material}</span>
          </div>
          <div class="meta-item">
            <strong>Color:</strong>
            <span>${product.color || '—'}</span>
          </div>
          <div class="meta-item">
            <strong>Categoría:</strong>
            <span>${(product.category || product.categoria_nombre || '').charAt(0).toUpperCase() + (product.category || product.categoria_nombre || '').slice(1)}</span>
          </div>
          <div class="meta-item">
            <strong>SKU:</strong>
            <span>${product.id}</span>
          </div>
        </div>

        <div class="product-page-options">
          <div class="quantity-selector">
            <label for="productPageQuantity">Cantidad:</label>
            <div class="qty-controls">
              <button type="button" onclick="decreaseProductPageQuantity()">-</button>
              <input type="number" id="productPageQuantity" value="1" min="1" max="10">
              <button type="button" onclick="increaseProductPageQuantity()">+</button>
            </div>
          </div>
        </div>

        <div class="product-page-features">
          <div class="feature">
            <span class="feature-icon">🚚</span>
            <span>Envío gratis en compras mayores a $879</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🔒</span>
            <span>Pago seguro</span>
          </div>
          <div class="feature">
            <span class="feature-icon">↩️</span>
            <span>Devoluciones en 30 días</span>
          </div>
        </div>

        <div class="product-page-actions">
          <button class="btn btn-primary btn-full" onclick="addToCartFromProductPage('${product.id}')">
            Añadir al carrito
          </button>
          <button class="btn btn-outline btn-full" onclick="addToCartAndCheckoutFromPage('${product.id}')">
            Comprar ahora
          </button>
        </div>

        <div class="product-page-description" style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e0e0e0;">
          <h3 style="font-family: \"GFS Didot\", serif; margin-bottom: 1rem;">Descripción</h3>
          <p style="color: var(--gris); line-height: 1.8;">
            ${(product.descripcion_larga || product.descripcion_corta) || `Pieza de joyería mexicana minimalista hecha a mano con ${(product.material || '').toLowerCase()}. Cada pieza es única y refleja la esencia de la artesanía mexicana.`}
          </p>
        </div>
      </div>
    </div>
  `;
}

// Funciones auxiliares para la página de producto
// Funciones auxiliares para controlar la cantidad (página de producto)
window.increaseProductPageQuantity = function() {
  const quantityInput = document.getElementById('productPageQuantity');
  if (!quantityInput) return;
  
  const currentValue = parseInt(quantityInput.value);
  if (currentValue < 10) {
    quantityInput.value = currentValue + 1;
  }
};

window.decreaseProductPageQuantity = function() {
  const quantityInput = document.getElementById('productPageQuantity');
  if (!quantityInput) return;
  
  const currentValue = parseInt(quantityInput.value);
  if (currentValue > 1) {
    quantityInput.value = currentValue - 1;
  }
};

function addToCartFromProductPage(productId) {
  const quantityInput = document.getElementById('productPageQuantity');
  if (!quantityInput) return;
  
  const quantity = parseInt(quantityInput.value) || 1;
  cart.addItem(productId, quantity);
  showAddToCartMessage(productId, quantity);
}

// Función para agregar desde el carrusel de piezas destacadas
window.addToCartFromFeatured = function(productId) {
  cart.addItem(productId, 1);
  showAddToCartMessage(productId, 1);
};

function addToCartAndCheckoutFromPage(productId) {
  const quantityInput = document.getElementById('productPageQuantity');
  if (!quantityInput) return;
  
  const quantity = parseInt(quantityInput.value) || 1;
  cart.addItem(productId, quantity);
  
  // Abrir el carrito después de un pequeño delay para que se actualice
  setTimeout(() => {
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
      cartModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }, 100);
}

// Función para cambiar la imagen principal al hacer clic en una miniatura
window.changeMainImage = function(imageSrc, index) {
  const mainImage = document.getElementById('mainProductImage');
  if (mainImage) {
    mainImage.src = imageSrc;
    // Actualizar la clase activa en las miniaturas
    const thumbnails = document.querySelectorAll('.product-thumbnail');
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }
};

// Inicializar videos de reels de Instagram
function initReelVideos() {
  const reelVideos = document.querySelectorAll('.reel-video');
  
  reelVideos.forEach(video => {
    const container = video.closest('.reel-video-container');
    
    // Reproducir video cuando está visible en viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().catch(err => {
            // Silenciar errores de autoplay (algunos navegadores bloquean autoplay)
            console.log('Autoplay bloqueado:', err);
          });
        } else {
          video.pause();
        }
      });
    }, {
      threshold: 0.5 // Reproducir cuando al menos 50% del video es visible
    });
    
    observer.observe(video);
    
    // Reproducir al hacer hover
    container.addEventListener('mouseenter', () => {
      video.play().catch(err => console.log('Error al reproducir:', err));
    });
    
    // Pausar al salir del hover (opcional)
    container.addEventListener('mouseleave', () => {
      // No pausamos para mantener la reproducción continua
    });
    
    // Manejar errores de carga
    video.addEventListener('error', (e) => {
      console.warn('Error al cargar video:', video.src);
      // Ocultar el contenedor si el video no se puede cargar
      container.style.display = 'none';
    });
  });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReelVideos);
} else {
  initReelVideos();
}

