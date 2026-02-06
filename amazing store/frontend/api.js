import { getInitData } from './state.js';

const API_BASE_URL = '/api';

// XUSUSIY XATOLIK KLASSI
// Bu bizga status kodini ham saqlab qolish imkonini beradi
class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function apiFetch(endpoint, options = {}) {
    const initData = getInitData();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (initData) {
        headers['X-Telegram-Data'] = initData;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // O'ZGARTIRILDI: Xatoliklarni qayta ishlash mantiqi to'liq yangilandi
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            // Javob tanasini o'qishga harakat qilamiz
            const errorData = await response.json();
            // Backend yuborgan "error" yoki "message" maydonini qidiramiz
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
            // Agar javob tanasi bo'sh yoki JSON formatida bo'lmasa, standart xabardan foydalanamiz
            console.error("Could not parse error response JSON:", e);
        }
        // Xatolikni status kodi bilan birga tashlaymiz
        throw new ApiError(errorMessage, response.status);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {};
}


export function updateUser(userData) {
    return apiFetch(`/users/profile`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}

// DEPRECATED: Old cart update (for backward compatibility)
export function updateCart(cart) {
    return apiFetch('/users/cart', {
        method: 'PUT',
        body: JSON.stringify({ cart }),
    });
}

export function updateFavorites(favorites) {
    return apiFetch('/users/favorites', {
        method: 'PUT',
        body: JSON.stringify({ favorites }),
    });
}

// --- NEW CART API ENDPOINTS ---

/**
 * Get user's cart items
 * @returns {Promise<{items: Array, summary: Object}>}
 */
export function getCartItems() {
    return apiFetch('/cart');
}

/**
 * Add product to cart or update quantity
 * @param {number} productId - Product ID
 * @param {number} quantity - Quantity
 * @returns {Promise<Object>}
 */
export function addToCartAPI(productId, quantity = 1) {
    return apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
    });
}

/**
 * Update cart item (quantity, is_selected, is_liked)
 * @param {number} cartItemId - Cart item ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export function updateCartItem(cartItemId, updates) {
    return apiFetch(`/cart/${cartItemId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
}

/**
 * Delete item from cart
 * @param {number} cartItemId - Cart item ID
 * @returns {Promise<Object>}
 */
export function deleteCartItem(cartItemId) {
    return apiFetch(`/cart/${cartItemId}`, {
        method: 'DELETE',
    });
}

/**
 * Clear entire cart
 * @returns {Promise<Object>}
 */
export function clearCartAPI() {
    return apiFetch('/cart', {
        method: 'DELETE',
    });
}


// O'ZGARTIRILDI: Funksiya nomi va yo'li backendga moslashtirildi.
export async function validateUser() {
    try {
        // Yo'l /auth/validate dan /users/validate ga o'zgartirildi
        const data = await apiFetch('/users/validate', {
            method: 'POST',
        });
        console.log('Validation successful:', data);
        return data;
    } catch (error) {
        console.error('Validation failed in validateUser:', error.message, 'Status:', error.status);
        throw error;
    }
}

// PERFORMANCE: Pagination bilan mahsulotlarni olish
export function getProducts(categoryId = null, limit = 20, offset = 0) {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId);
    params.append('limit', limit);
    params.append('offset', offset);
    
    return apiFetch(`/products?${params.toString()}`);
}

export function getBanners() {
    return apiFetch('/banners');
}

// O'ZGARTIRILDI: Kategoriyalarni olish funksiyasi
export function getCategories() {
    return apiFetch('/categories');
}

export function getOrders() {
    return apiFetch('/orders');
}

export function createOrder(order) {
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
    });
}