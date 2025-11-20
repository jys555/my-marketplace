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


// --- Mavjud funksiyalaringiz o'zgarishsiz qoladi ---

export async function registerUser(user) {
    // server.js da telegram_id middleware orqali olinadi, shuning uchun
    // bu yerdan yuborish shart emas.
    return apiFetch('/users', { // Marshrut /users/register dan /users ga o'zgartirildi
        method: 'POST',
        body: JSON.stringify(user),
    });
}

export function getUser(userId) {
    return apiFetch(`/users/${userId}`);
}

export function updateUser(userId, userData) {
    return apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}

export function getProducts() {
    return apiFetch('/products');
}

export function getBanners() {
    return apiFetch('/banners');
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

// --- Admin funksiyalari ---
export function createProduct(product) {
    return apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
}

export function updateProduct(productId, product) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    });
}

export function deleteProduct(productId) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'DELETE',
    });
}

export async function authenticateWithBackend() {
    try {
        const data = await apiFetch('/auth/validate', {
            method: 'POST',
        });
        console.log('Authentication successful:', data);
        return data;
    } catch (error) {
        console.error('Authentication failed in authenticateWithBackend:', error.message, 'Status:', error.status);
        // Xatolikni o'zgartirmasdan yuqoriga uzatamiz
        throw error;
    }
}