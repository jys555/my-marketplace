import { getInitData } from './state.js'; // ADDED: Import getInitData

const API_BASE_URL = '/api';

// O'ZGARTIRILDI: apiFetch funksiyasi to'liq yangilandi.
/**
 * Backendga so'rov yuborish uchun markazlashtirilgan funksiya.
 * Avtomatik ravishda xavfsiz 'X-Telegram-Data' sarlavhasini qo'shadi.
 * @param {string} endpoint - API endpointi (masalan, '/users')
 * @param {object} options - Fetch uchun sozlamalar (method, body, etc.)
 * @returns {Promise<any>} - Server javobi
 */
async function apiFetch(endpoint, options = {}) {
    const initData = getInitData(); // CHANGED: Get initData from state
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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `An unknown error occurred (${response.status})` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    // Ba'zi so'rovlar (masalan, DELETE) bo'sh javob qaytarishi mumkin.
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return {}; // Bo'sh javob uchun bo'sh ob'ekt qaytaramiz.
}

// O'ZGARTIRILDI: Funksiyalar loyihaning umumiy tuzilishiga moslashtirildi.

export async function registerUser(user) {
    return apiFetch('/users/register', {
        method: 'POST',
        body: JSON.stringify(user),
    });
}

export async function getUser(userId) {
    return apiFetch(`/users/${userId}`);
}

export async function getProducts() {
    return apiFetch('/products');
}

export async function getBanners() {
    return apiFetch('/banners');
}

export async function createOrder(order) {
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
    });
}

// --- Admin funksiyalari ---
export async function createProduct(product) {
    return apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
}

export async function updateProduct(productId, product) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    });
}

export async function deleteProduct(productId) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'DELETE',
    });
}

// ADDED: A new function to handle the initial validation with the backend
export async function authenticateWithBackend() {
    try {
        const data = await apiFetch('/auth/validate', {
            method: 'POST',
        });
        console.log('Authentication successful:', data);
        return data; 
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
    }
}