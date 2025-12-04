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

// O'ZGARTIRILDI: Kategoriya parametri qo'shildi
export function getProducts(categoryId = null) {
    const url = categoryId ? `/products?category_id=${categoryId}` : '/products';
    return apiFetch(url);
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