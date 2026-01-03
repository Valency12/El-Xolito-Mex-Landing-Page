// Servicio de productos - Conecta con la API del backend
const API_BASE_URL = 'http://localhost:3000/api';

// Función para hacer requests a la API
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...options
  };

  try {
    console.log(`🌐 Haciendo petición a: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Respuesta recibida de ${endpoint}:`, {
      success: data.success,
      hasData: !!data.data,
      productsCount: data.data?.products?.length || data.data?.count || 0
    });
    
    return data;
  } catch (error) {
    console.error(`❌ Error en API request a ${endpoint}:`, error);
    console.error('   Verifica que el servidor backend esté corriendo en http://localhost:3000');
    throw error;
  }
}

// Obtener todos los productos (con filtros opcionales)
async function getAllProducts(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.categoria) queryParams.append('categoria', filters.categoria);
    if (filters.destacado !== undefined) queryParams.append('destacado', filters.destacado);
    if (filters.activo !== undefined) queryParams.append('activo', filters.activo);
    
    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? '?' + queryString : ''}`;
    
    const response = await apiRequest(endpoint);
    
    if (response.success) {
      return {
        success: true,
        products: response.data.products,
        count: response.data.count
      };
    }
    
    throw new Error(response.message || 'Error al obtener productos');
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener productos',
      products: [],
      count: 0
    };
  }
}

// Obtener un producto por ID
async function getProductById(id) {
  try {
    const response = await apiRequest(`/products/${id}`);
    
    if (response.success) {
      return {
        success: true,
        product: response.data.product
      };
    }
    
    throw new Error(response.message || 'Producto no encontrado');
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener producto',
      product: null
    };
  }
}

// Obtener productos por categoría (slug)
async function getProductsByCategory(slug) {
  try {
    const response = await apiRequest(`/products/category/${slug}`);
    
    if (response.success) {
      return {
        success: true,
        products: response.data.products,
        count: response.data.count
      };
    }
    
    throw new Error(response.message || 'Error al obtener productos por categoría');
  } catch (error) {
    console.error('Error al obtener productos por categoría:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener productos por categoría',
      products: [],
      count: 0
    };
  }
}

// Obtener todas las categorías
async function getAllCategories() {
  try {
    const response = await apiRequest('/categories');
    
    if (response.success) {
      return {
        success: true,
        categories: response.data.categories,
        count: response.data.count
      };
    }
    
    throw new Error(response.message || 'Error al obtener categorías');
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener categorías',
      categories: [],
      count: 0
    };
  }
}

// Obtener una categoría por slug
async function getCategoryBySlug(slug) {
  try {
    const response = await apiRequest(`/categories/${slug}`);
    
    if (response.success) {
      return {
        success: true,
        category: response.data.category
      };
    }
    
    throw new Error(response.message || 'Categoría no encontrada');
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    return {
      success: false,
      message: error.message || 'Error al obtener categoría',
      category: null
    };
  }
}

// Función helper para obtener la imagen principal de un producto
function getMainImage(product) {
  if (!product || !product.imagenes || product.imagenes.length === 0) {
    return product?.image || 'assets/placeholder.jpg'; // Fallback a imagen hardcodeada si existe
  }
  
  const mainImage = product.imagenes.find(img => img.es_principal);
  return mainImage ? mainImage.ruta : product.imagenes[0].ruta;
}

// Función helper para formatear producto desde API a formato del frontend
function formatProductForFrontend(apiProduct) {
  return {
    id: apiProduct.id,
    name: apiProduct.nombre,
    category: apiProduct.categoria_slug || apiProduct.categoria_nombre?.toLowerCase(),
    price: apiProduct.precio,
    precio_anterior: apiProduct.precio_anterior,
    material: apiProduct.material,
    color: apiProduct.color,
    featured: apiProduct.destacado,
    image: getMainImage(apiProduct),
    imagenes: apiProduct.imagenes || [],
    stock: apiProduct.stock,
    descripcion_corta: apiProduct.descripcion_corta,
    descripcion_larga: apiProduct.descripcion_larga,
    slug: apiProduct.slug
  };
}

// Exportar funciones INMEDIATAMENTE al cargar el script
// Asegurarse de que window.productService esté disponible
(function() {
  'use strict';
  console.log('📦 productService.js cargándose...');
  
  if (typeof window !== 'undefined') {
    window.productService = {
      getAllProducts,
      getProductById,
      getProductsByCategory,
      getAllCategories,
      getCategoryBySlug,
      getMainImage,
      formatProductForFrontend
    };
    console.log('✅ productService exportado a window.productService');
    console.log('   Funciones disponibles:', Object.keys(window.productService));
    
    // Disparar evento personalizado para notificar que está listo
    if (typeof document !== 'undefined') {
      const event = new CustomEvent('productServiceReady');
      document.dispatchEvent(event);
      console.log('📢 Evento productServiceReady disparado');
    }
  } else {
    console.error('❌ window no está disponible, productService no se puede exportar');
  }
})();
