const backendUrl = 'https://my-marketplace-production.up.railway.app';
const WebApp = window.Telegram.WebApp;
const telegramId = WebApp.initDataUnsafe?.user?.id;

/**
 * Backendga so'rov yuborish uchun markazlashtirilgan funksiya.
 * Avtomatik ravishda autentifikatsiya sarlavhasini qo'shadi.
 * @param {string} endpoint - API endpointi (masalan, '/users')
 * @param {object} options - Fetch uchun sozlamalar (method, body, etc.)
 * @returns {Promise<any>} - Server javobi
 */
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (telegramId) {
        headers['X-Telegram-ID'] = telegramId;
    }

    const response = await fetch(`${backendUrl}/api${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Server error');
    }

    return response.json();
}

// --- User API ---
export const checkUserRegistration = () => apiFetch(`/users/check/${telegramId}`);
export const getUserData = () => apiFetch(`/users/${telegramId}`);
export const updateUser = (userData) => apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
});

// --- Product API ---
export const getProducts = (lang) => apiFetch(`/products?lang=${lang}`);

// --- Order API ---
export const getOrders = () => apiFetch('/orders');
export const createOrder = (orderData) => apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
});

// --- Registration ---
export const registerUser = (userData) => apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify({
        telegram_id: telegramId,
        username: WebApp.initDataUnsafe?.user?.username || null,
        ...userData,
    }),
});