// Servicio de autenticación - Conecta con la API del backend
// URL: landing-page/config.js (o window.__EL_XOLITO_API__ antes de cargar este script)
function getApiBaseUrl() {
  if (typeof window !== 'undefined' && typeof window.getElXolitoApiBase === 'function') {
    return window.getElXolitoApiBase();
  }
  return 'http://localhost:3000/api';
}

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
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Si el token expiró, intentar renovarlo
      if (response.status === 401 && token) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Reintentar la petición con el nuevo token
          config.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
          const retryResponse = await fetch(`${getApiBaseUrl()}${endpoint}`, config);
          const retryData = await retryResponse.json();
          return retryData;
        }
      }
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en API request:', error);
    throw error;
  }
}

// Registrar nuevo usuario
async function register(email, password, nombre_completo, telefono = null) {
  try {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        nombre_completo,
        telefono
      })
    });

    if (response.success) {
      // Guardar tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      
      return {
        success: true,
        user: response.data.user
      };
    }

    throw new Error(response.message || 'Error al registrar');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error al registrar usuario'
    };
  }
}

// Iniciar sesión
async function login(email, password) {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success) {
      // Guardar tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      
      return {
        success: true,
        user: response.data.user
      };
    }

    throw new Error(response.message || 'Error al iniciar sesión');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error al iniciar sesión'
    };
  }
}

/**
 * Login / registro con Google Identity Services.
 * @param {string} credential - JWT (ID token) que entrega Google en el callback
 */
async function loginWithGoogle(credential) {
  try {
    if (!credential) {
      return { success: false, message: 'No se recibió el token de Google' };
    }
    const response = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });

    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      return {
        success: true,
        user: response.data.user
      };
    }

    throw new Error(response.message || 'Error al iniciar sesión con Google');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error al iniciar sesión con Google'
    };
  }
}

/** Solicitar correo de restablecimiento */
async function forgotPassword(email) {
  try {
    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    if (response.success) {
      return { success: true, message: response.message };
    }
    throw new Error(response.message || 'No se pudo enviar el correo');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'No se pudo enviar el correo'
    };
  }
}

/** Guardar nueva contraseña con token del enlace */
async function resetPassword(token, password) {
  try {
    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
    if (response.success) {
      return { success: true, message: response.message };
    }
    throw new Error(response.message || 'No se pudo restablecer la contraseña');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'No se pudo restablecer la contraseña'
    };
  }
}

// Cerrar sesión
async function logout() {
  try {
    // Intentar cerrar sesión en el servidor
    await apiRequest('/auth/logout', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error al cerrar sesión en servidor:', error);
  } finally {
    // Siempre limpiar tokens locales
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
}

// Obtener información del usuario actual
async function getCurrentUser() {
  try {
    const response = await apiRequest('/auth/me');
    
    if (response.success) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    // Si hay error, limpiar tokens
    logout();
    return null;
  }
}

// Renovar token de acceso
async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error al renovar token:', error);
    return false;
  }
}

// Verificar si el usuario está autenticado
function isAuthenticated() {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('currentUser');
  return !!(token && user);
}

/**
 * Vacía el carrito del servidor, sube los ítems del carrito local y crea el pedido.
 * @param {Array<{ id: string|number, quantity: number }>} localItems - ítems del carrito en memoria (id = producto_id)
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
async function checkoutFromLocalCart(localItems) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return { success: false, message: 'Debes iniciar sesión para pagar' };
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  try {
    const clearRes = await fetch(`${getApiBaseUrl()}/cart`, { method: 'DELETE', headers });
    const clearData = await clearRes.json().catch(() => ({}));
    if (!clearRes.ok && clearRes.status !== 404) {
      return { success: false, message: clearData.message || 'No se pudo preparar el carrito' };
    }

    for (const item of localItems) {
      const pid = parseInt(item.id, 10);
      if (Number.isNaN(pid) || pid < 1) {
        return { success: false, message: 'Hay un producto en el carrito con un identificador no válido' };
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const res = await fetch(`${getApiBaseUrl()}/cart/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ producto_id: pid, cantidad: qty })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          message: data.message || `No se pudo añadir el producto ${pid} al pedido`
        };
      }
    }

    const orderRes = await fetch(`${getApiBaseUrl()}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const orderData = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) {
      return {
        success: false,
        message: orderData.message || 'No se pudo crear el pedido'
      };
    }
    return { success: true, data: orderData.data || orderData };
  } catch (e) {
    console.error('checkoutFromLocalCart:', e);
    const isNetwork =
      e?.name === 'TypeError' ||
      (typeof e?.message === 'string' &&
        (e.message === 'Failed to fetch' || e.message.includes('NetworkError') || e.message.includes('fetch')));
    const message = isNetwork
      ? 'No hay conexión con el servidor. Comprueba tu internet, que la API esté activa y CORS en producción.'
      : (e.message || 'Error de conexión al procesar el pago');
    return { success: false, message };
  }
}

// Obtener usuario del localStorage
function getStoredUser() {
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Lista pedidos del usuario autenticado (GET /api/orders)
 * @returns {Promise<{ success: boolean, orders: Array, message?: string }>}
 */
async function fetchMyOrders() {
  try {
    const response = await apiRequest('/orders');
    if (response.success && response.data) {
      return {
        success: true,
        orders: response.data.orders || []
      };
    }
    return { success: true, orders: [] };
  } catch (error) {
    console.error('fetchMyOrders:', error);
    return {
      success: false,
      orders: [],
      message: error.message || 'No se pudieron cargar las órdenes'
    };
  }
}

// Exportar funciones
window.authService = {
  register,
  login,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
  logout,
  getCurrentUser,
  refreshToken,
  isAuthenticated,
  getStoredUser,
  checkoutFromLocalCart,
  fetchMyOrders
};

