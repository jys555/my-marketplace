// O'ZGARTIRILDI: backendUrl olib tashlandi, chunki biz nisbiy yo'llardan foydalanamiz.
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
    // initData'ni global state'dan olamiz (bu main.js'da o'rnatiladi)
    const { initData } = getState(); 
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // O'ZGARTIRILDI: Xavfli 'X-Telegram-ID' o'rniga xavfsiz 'X-Telegram-Data' ishlatamiz.
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

// QO'SHILDI: Backend bilan dastlabki autentifikatsiya uchun yangi funksiya.
async function authenticateWithBackend(initData) {
    try {
        // Biz server.js'ga qo'shgan yangi endpoint'ga so'rov yuboramiz.
        const data = await apiFetch('/auth/validate', {
            method: 'POST',
            // Bu yerda initData'ni ham sarlavhada, ham tanada yuborishimiz mumkin.
            // Sarlavha orqali yuborish standartroq.
        });
        console.log('Authentication successful:', data);
        return data.user; // Serverdan tasdiqlangan foydalanuvchi ma'lumotini olamiz.
    } catch (error) {
        console.error('Authentication failed:', error);
        throw error;
    }
}

// O'ZGARTIRILDI: Funksiyalar loyihaning umumiy tuzilishiga moslashtirildi.

async function registerUser(user) {
    return apiFetch('/users/register', {
        method: 'POST',
        body: JSON.stringify(user),
    });
}

async function getUser(userId) {
    return apiFetch(`/users/${userId}`);
}

async function getProducts() {
    return apiFetch('/products');
}

async function getBanners() {
    return apiFetch('/banners');
}

async function createOrder(order) {
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
    });
}

// --- Admin funksiyalari ---
async function createProduct(product) {
    return apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify(product),
    });
}

async function updateProduct(productId, product) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(product),
    });
}

async function deleteProduct(productId) {
    return apiFetch(`/admin/products/${productId}`, {
        method: 'DELETE',
    });
}